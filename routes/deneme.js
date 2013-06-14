var tables = [], table = null, currentTag = null;
		parser.addListener('onclosetag', function(tagName) { 
			if(tagName === "table") {
				console.log('entered');
				tables.push(table);
				currentTag = table = null;
				return;
			}
			if (currentTag && currentTag.parent) {
				console.log('entered');
				var p = currentTag.parent;
				delete currentTag.parent;
				currentTag = p;
			}
		});
		//parser.onclosetag = function (tagName) { }
		parser.onopentag = function (tag) {
			if (tag.name !== "table" && !table) {
				console.log('entered');
				return;
			}
			if (tag.name === "table") {
				console.log('entered');
				table = tag;
			}
			tag.parent = currentTag;
			tag.children = [];
			tag.parent && tag.parent.children.push(tag);
			currentTag = tag;
		}

		parser.ontext = function (text) {
			if (currentTag) {
				console.log('entered');
				currentTag.children.push(text);
			}
		}

		//console.dir(result);
		//console.log('Done.');
		/*parser.parseString(xml, function(err, data){
			console.log(tables.length);
			var i;
			for(i=0; i < tables.length; i++){
			console.log(tables[i]);
			}
			console.dir(tables);
			});*/

