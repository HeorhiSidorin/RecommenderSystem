var sqlite3 = require('sqlite3').verbose();
var regexp = require('node-regexp');
var natural = require('natural');
var fs = require('fs');

var reVk = regexp().must('vk.com').ignoreCase().toRegExp();
var reGgl = regexp().must('google').ignoreCase().toRegExp();
var reGmail = regexp().must('gmail').ignoreCase().toRegExp();
var reJobs = regexp().must('jobs.tut.by').ignoreCase().toRegExp();
var reASP = regexp().must('smarterasp.net').ignoreCase().toRegExp();
var reBIB = regexp().must('belinvest').ignoreCase().toRegExp();
var reTrans = regexp().must('translate').ignoreCase().toRegExp();
var reLocalhost = regexp().must('localhost').ignoreCase().toRegExp();
var reAsk = regexp().must('ask.fm').ignoreCase().toRegExp();
var rePoezd = regexp().must('rw.by').ignoreCase().toRegExp();
var reYtb = regexp().must('youtube.com').ignoreCase().toRegExp();
var reParimatch = regexp().must('parimatch').ignoreCase().toRegExp();
var reTut = regexp().end('tut.by').ignoreCase().toRegExp();

var check_url = function(url){
	return [reVk, reGgl, reGmail, reJobs, reBIB, reTrans, reLocalhost, reTut, reAsk, rePoezd, reYtb, reParimatch, reASP].every(el => el.test(url) == false);
}

var callPythonLemmatizer = function(){
	return require('child_process').execSync('python lemmatizer.py 3');
}

var StopWords = fs.readFileSync('stop-words.txt').toString().split('\r\n');

var HashTable = {};

var writeLemmatizersInput = function(words){
	words.forEach(function(word){
		fs.appendFileSync("lemmatizersInput.txt", word + ' ', 'utf-8');
	});
}

var insertInHashTable = function(word, count){
		if(StopWords.indexOf(word) == -1) {
			word = natural.PorterStemmerRu.stem(word);
			if(word in HashTable)
				HashTable[word] += count;
			else
				HashTable[word] = count;
		}
}

var russianPattern = /[а-яА-ЯЁё]/g;

var db = new sqlite3.Database('../History');

db.all("SELECT title,visit_count,url FROM urls", function(err, rows) {
		var time = Date.now();  
		var word_count = 0;
		var counts = [];
        rows.forEach(function (row) {  
        	if(check_url(row.url)){
				if(row.title != '' && russianPattern.test(row.title)){
					var sentence = row.title.replace(/[^а-яА-ЯЁё -]/gi, ' ').replace(/[Ёё]/gi, 'е');
					sentence = sentence.replace(/[-]/gi, ' ').trim();
					sentence = sentence.toLowerCase();
					var words = sentence.split(' ').filter(function(word){return word != ""});
					word_count += words.length;
					writeLemmatizersInput(words);
					for(w in words)
						counts.push(row.visit_count);
				}
        	}
        });
        callPythonLemmatizer();
        var words = fs.readFileSync('lemmatizersOutput.txt').toString().split(' ');
        for(var i = 0; i < words.length; i++)
        	insertInHashTable(words[i], counts[i]);

        console.log((Date.now()-time)/1000);
        console.log(word_count);
        var arr = Object.keys(HashTable).map(function(k) { return HashTable[k] });
        
        arr = (function uniq(ar) {
    		return ar.sort(function(a, b){return a-b}).filter(function(item, pos, ary) {
        		return !pos || item != ary[pos - 1];
		    })
		})(counts);

		var Ratings = {};

		for(var i = 0; i < arr.length; i++){
			for(var key in HashTable) {
			    if(HashTable[key] == arr[i]) {
			        Ratings[key] = i+1;
			    }
			}
		};
		console.log(Object.keys(Ratings).length);
		fs.writeFileSync('hash-table-ratings.json', JSON.stringify(Ratings) , 'utf-8');
		fs.unlinkSync("lemmatizersInput.txt");
		fs.unlinkSync("lemmatizersOutput.txt");
    });
  
db.close();