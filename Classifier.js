var sqlite3 = require('sqlite3').verbose();
var natural = require('natural');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

var writeLemmatizersInput = function(words, n){
	words.forEach(function(word){
		fs.appendFileSync("lemmatizersInput"+n+".txt", word + ' ', 'utf-8');
	});
}

var callPythonLemmatizer = function(n){
	return require('child_process').execSync('python lemmatizer.py '+ n);
}

var StopWords = fs.readFileSync('stop-words.txt').toString().split('\r\n');

var trainClassifier = function(){
	var likes = [];
	var dislikes = [];
	natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
		var db = new sqlite3.Database('../Cookies');
		db.all("SELECT name FROM cookies WHERE name LIKE '%liketut%'", function(err, rows) {
				rows.forEach(function(row){
					if(row.name.split('liketut:')[0] == ""){
						likes.push(row.name.split('liketut:')[1]);
						db.run("DELETE FROM cookies WHERE name = '"+row.name+"'", function(error) {
							if (error)
								console.log(error);
						});
					}
					else {
						dislikes.push(row.name.split('liketut:')[1]);
						db.run("DELETE FROM cookies WHERE name = '"+row.name+"'", function(error) {
							if (error)
								console.log(error);
						});
					}
				});
				likes.forEach(function(link, index){
					request(link, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							$ = cheerio.load(body);
					    	var articleText = $('#article_body').text().replace(/[^а-яА-ЯЁё -]/gi, ' ').replace(/[-]/gi, ' ').trim().toLowerCase().split(' ');
					    	fs.writeFileSync('lemmatizersInput1.txt','','utf-8');
							writeLemmatizersInput(articleText, 1);
							callPythonLemmatizer(1);
							articleText = fs.readFileSync('lemmatizersOutput1.txt').toString().split(' ');
							fs.writeFileSync('lemmatizersOutput1.txt','','utf-8');
							articleText.pop();
							articleText = articleText.filter(function(word){return StopWords.indexOf(word) == -1}).join(' ').replace(/[Ёё]/gi, 'е');
							natural.PorterStemmerRu.attach();
							articleText = articleText.tokenizeAndStem().join(' ');
							classifier.addDocument(articleText, 'like');
							if(index == likes.length-1){
								dislikes.forEach(function(link, index){
									request(link, function (error, response, body) {
										if (!error && response.statusCode == 200) {
											$ = cheerio.load(body);
									    	var articleText = $('#article_body').text().replace(/[^а-яА-ЯЁё -]/gi, ' ').replace(/[-]/gi, ' ').trim().toLowerCase().split(' ');
									    	fs.writeFileSync('lemmatizersInput2.txt','','utf-8');
											writeLemmatizersInput(articleText, 2);
											callPythonLemmatizer(2);
											articleText = fs.readFileSync('lemmatizersOutput2.txt').toString().split(' ');
											fs.writeFileSync('lemmatizersOutput2.txt','','utf-8');
											articleText.pop();
											articleText = articleText.filter(function(word){return StopWords.indexOf(word) == -1}).join(' ').replace(/[Ёё]/gi, 'е');
											natural.PorterStemmerRu.attach();
											articleText = articleText.tokenizeAndStem().join(' ');
											classifier.addDocument(articleText, 'dislike');
											if(index == dislikes.length-1){
												classifier.train();
												classifier.save('classifier.json', function(err, classifier) {
												  
												});
											}
										}
									});
								});
							}
						}
					});
				});
								
		});
		db.close()
	});	
}

trainClassifier();