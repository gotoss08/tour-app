$(() => {
	$('input').click(function(){     
		$('input').attr('checked', false);
		$(this).attr('checked', true);          
	});
});