var parser = require('rss-url-parser');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var natural = require('natural');

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
				  	articleArray.push({'link': article.link, 'text': '', 'name': article.title});
				}
				else {
				   	articleArray.push({'link': article.link, 'text': articleText, 'name': article.title});
				}
		  	}
		  	if(articlesCount === articles.length) {
		  		for(var i = 0; i < articleArray.length; i++){
		  			if(articleArray[i].text != ''){
		  				articleArray[i].text = articleArray[i].text.replace(/[^а-яА-ЯЁё -]/gi, ' ').replace(/[-]/gi, ' ').trim().toLowerCase().split(' ').filter(function(word){return word != ""}).filter(function(word){return StopWords.indexOf(word) == -1});
		  			}
		  		}
		  		for(var i = 0; i < articleArray.length; i++){
		  			if(articleArray[i].text != ''){
		  				writeLemmatizersInput(articleArray[i].text);
			  			callPythonLemmatizer();
			  			articleArray[i].text = fs.readFileSync('lemmatizersOutput.txt').toString().split(' ');
			  			articleArray[i].text.pop();
			  			articleArray[i].text = articleArray[i].text.join(' ').replace(/[Ёё]/gi, 'е');
			  			natural.PorterStemmerRu.attach();
			  			articleArray[i].text = articleArray[i].text.tokenizeAndStem();
						fs.unlinkSync("lemmatizersInput.txt");
						fs.unlinkSync("lemmatizersOutput.txt");
		  			}		  			
		  		}
		  		natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
		  			for(var i = 0; i < articleArray.length; i++){
		  				if(articleArray[i].text != ''){
			  				articleArray[i].rating = classifier.getClassifications(articleArray[i].text)[0].value;
			  			}
			  			else articleArray[i].rating = 0;	
		  			};
		  			var topArticle = articleArray.sort(function(a,b){return b.rating - a.rating}).slice(0,6);
		  			fs.writeFileSync('top-article.json', JSON.stringify(topArticle), 'utf-8');
		  		});
		  	}
		})			
	})
})