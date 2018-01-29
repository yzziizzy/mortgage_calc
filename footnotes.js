$(function() {
	
	var fnc = 1;
	
	$('footnote').each(function() {
		var n = $(this);
		var c = n.html();
		
		var p = $('<div></div>')
			.html(c)
			.addClass('fn-popup')
			.hide();
		
		n.html(fnc).css({display:'inline-block'});
		n.append(p);
		
		n.click(function() { 
			$('footnote > div').hide();
			p.show();
		});
		
		p.click(function(e) {
			p.hide();
			e.stopPropagation();
		});
		
		fnc++;
	});
	
	
	
	
});