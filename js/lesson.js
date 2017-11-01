$(function() {
	var lesson = $('#lesson');

	lesson.carousel({
		interval: false,
		wrap: false
	});

	var slideTypes = ['interactive', 'question', 'learn'];

	lesson.on('slide.bs.carousel', function() {
		setTimeout(function() {
			var type = lesson.find('.carousel-item.active').last().data('type');
			$('body').removeClass(slideTypes.join(' '));
			$('body').addClass(type);
		}, 700);
	});

	$('body').addClass($('.carousel-item').first().data('type'));

	function setInput(input, value) {
		if (value != null)
			input.val(value);
		input.attr('size', input.val().length + 1);
		if (input.css('width') != 'auto')
			setTimeout(function() {
				input.css('width', 'auto');
			}, 100);
	};

	$('.carousel-item').each(function() {
		var item = $(this);
		var type = item.data('type');

		// Ensure the input resizes with the text content
		item.find('input').each(function() {
			var input = $(this);
			input.keydown(function() {
				setInput(input);
			});
		});

		item.find('.next').click(function() {
			lesson.carousel('next');
		});

		if (type == 'interactive') {
			var inputMap = {};

			item.find('input').each(function() {
				var input = $(this);
				var name = input.attr('name');
				if (! inputMap[name])
					inputMap[name] = [];
				inputMap[name].push(input);

				input.keyup(function() {
					inputMap[name].forEach(function(updateInput) {
						if (! updateInput.is(':focus'))
							setInput(updateInput, input.val());
					});
				});
			});
		}
		else if (type == 'question') {
			var inputList = [];
			var isCorrect = function(input) {
				if (input.data('exact') == 'true') {
					return input.data('expected') === input.val();
				}
				else {
					return input.data('expected').toLowerCase() == input.val().toLowerCase();
				}
			};

			var gradeButton = item.find('.grade');
			var gradeQuestion = function() {
				var correct = true;
				for (var i = 0 ; i < inputList.length ; i++) {
					if (inputList[i].data('expected') != null && !isCorrect(inputList[i])) {
						inputList[i].focus();
						correct = false;
						break;
					}
				}

				if (correct)
					gradeButton.text('Correct').addClass('correct').removeClass('wrong');
				else
					gradeButton.text('Try again').addClass('wrong').removeClass('correct');
			};
			gradeButton.click(gradeQuestion);

			item.find('input').each(function() {
				var input = $(this);
				var inputIndex = inputList.length;
				inputList.push(input);
				var name = input.attr('name');

				input.keyup(function(e) {
					if (e.which == 13) {
						if (inputIndex == inputList.length - 1)
							gradeQuestion();
						else
							inputList[inputIndex + 1].focus();
					}
				});
			});
		}
	});
});
