import pymorphy2
import codecs
import sys

morph = pymorphy2.MorphAnalyzer()

if(sys.argv[1] == '1'):
    with codecs.open('lemmatizersInput1.txt','r',encoding='utf8') as r:
        words = r.read()    
    words = words.split()
    
    with codecs.open('lemmatizersOutput1.txt', 'w', encoding='utf-8') as w:
        w.write('')
    
    for word in words:
        norm = morph.parse(word)[0].normal_form
        with codecs.open('lemmatizersOutput1.txt','a',encoding='utf8') as a:
    		a.write(norm+' ') 
elif(sys.argv[1] == '2'):
    with codecs.open('lemmatizersInput2.txt','r',encoding='utf8') as r:
        words = r.read()    
    words = words.split()
    
    with codecs.open('lemmatizersOutput2.txt', 'w', encoding='utf-8') as w:
        w.write('')
    
    for word in words:
        norm = morph.parse(word)[0].normal_form
        with codecs.open('lemmatizersOutput2.txt','a',encoding='utf8') as a:
    		a.write(norm+' ') 
else: 
    with codecs.open('lemmatizersInput.txt','r',encoding='utf8') as r:
        words = r.read()    
    words = words.split()
    
    with codecs.open('lemmatizersOutput.txt', 'w', encoding='utf-8') as w:
        w.write('')
    
    for word in words:
        norm = morph.parse(word)[0].normal_form
        with codecs.open('lemmatizersOutput.txt','a',encoding='utf8') as a:
    		a.write(norm+' ')