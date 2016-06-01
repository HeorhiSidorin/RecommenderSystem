var parser = require('rss-url-parser')
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var natural = require('natural'),
    TfIdf = natural.TfIdf,
    tfidf = new TfIdf();

var articlesCount = 0;
var articleArray = [];

var StopWords = fs.readFileSync('stop-words.txt').toString().split('\r\n');

var writeLemmatizersInput = function(words){
	words.forEach(function(word){
		fs.appendFileSync("lemmatizersInput.txt", word + ' ', 'utf-8');
	});
}

var callPythonLemmatizer = function(){
	return require('child_process').execSync('python lemmatizer.py 3');
}

parser('http://news.tut.by/rss/all.rss').then(function(articles){
	articles.forEach(function(article){
		request(article.link, function (error, response, body) {
			articlesCount++;
		  	if (!error && response.statusCode == 200) {
		    	$ = cheerio.load(body);
		    	var articleText = $('#article_body').text();
				if(articleText.indexOf('мультимедийный онлайн') != -1){
				  	articleArray.push({'link': article.link, 'text': 'unliked', 'name': article.title});
				}
				else {
				   	articleArray.push({'link': article.link, 'text': articleText, 'name': article.title});
				}
		  	}
		  	if(articlesCount === articles.length) {
		  		for(var i = 0; i < articleArray.length; i++){
		  			if(articleArray[i].text != 'unliked'){
		  				articleArray[i].text = articleArray[i].text.replace(/[^а-яА-ЯЁё -]/gi, ' ').replace(/[-]/gi, ' ').trim().toLowerCase().split(' ').filter(function(word){return word != ""}).filter(function(word){return StopWords.indexOf(word) == -1});
		  			}
		  		}
		  		for(var i = 0; i < articleArray.length; i++){
		  			if(articleArray[i].text != 'unliked'){
		  				writeLemmatizersInput(articleArray[i].text);
			  			callPythonLemmatizer();
			  			articleArray[i].text = fs.readFileSync('lemmatizersOutput.txt').toString().split(' ');
			  			articleArray[i].text.pop();
			  			articleArray[i].text = articleArray[i].text.join(' ').replace(/[Ёё]/gi, 'е');
			  			natural.PorterStemmerRu.attach();
			  			articleArray[i].text = articleArray[i].text.tokenizeAndStem();
			  			tfidf.addDocument(articleArray[i].text);
						fs.writeFileSync("lemmatizersInput.txt",'','utf-8');
						fs.writeFileSync("lemmatizersOutput.txt",'','utf-8');
		  			}
		  			else tfidf.addDocument('');			  			
		  		}
		  		for(var i = 0; i < articleArray.length; i++){
		  			if(articleArray[i].text != 'unliked'){
		  				var keywords = [];
		  				for(var k = 0; k < 10; k++){
		  					try{
		  						keywords.push(tfidf.listTerms(i)[k].term);
		  					}catch(e){
		  						keywords.push("");
		  					}
			  				
						}
						articleArray[i].text = keywords;
		  			}		  			
		  		}
		  		var ratings = JSON.parse(fs.readFileSync('hash-table-ratings.json', 'utf8'));
		  		for(var i = 0; i < articleArray.length; i++){
		  			if(articleArray[i].text == 'unliked')
		  				articleArray[i].rating = -1;
		  			else {
		  				articleArray[i].rating = 0;
		  				for(var k = 0; k < 10; k++){
		  					if(ratings[articleArray[i].text[k]]){
		  						articleArray[i].rating += ratings[articleArray[i].text[k]];
		  					}
		  					else articleArray[i].rating += 0;
		  				}
		  			}
		  		}
		  		var topArticle = articleArray.sort(function(a,b){return b.rating - a.rating}).slice(0,6);
		  		fs.writeFileSync('top-article.json', JSON.stringify(topArticle), 'utf-8');
		  	}
		})			
	})
})