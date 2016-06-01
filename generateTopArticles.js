require('natural').BayesClassifier.load('classifier.json', null, function(err, classifier) {
	if(classifier.classifier.totalExamples < 30){
		require('child_process').execSync('node hash-table.js');
		require('child_process').execSync('node TfIdf.js');
	}
	else {
		require('child_process').execSync('node generateTopArticlesUsingClassifier.js');
	}
});