$(function() {
	var lesson = $('#lesson');
	var lessonId = lesson.data('id');

	// Stores the user state of this lesson
	var lessonState;

	// If the browser supports local storage, then load the initial state
	if (lessonId != null && window.localStorage != null) {
		try {
			lessonState = JSON.parse(window.localStorage.getItem(lessonId));
		} catch(e) {}

		if (lessonState == null) {
			lessonState = {};
			window.localStorage.setItem(lessonId, '{}');
		}
	}

	// Utility method for setting the state
	var setState = function(k, v) {
		if (lessonState) {
			if (Array.isArray(k)) {
				let c = lessonState;
				for (let i = 0 ; i < k.length - 1 ; i++) {
					if (c[k[i]] == null)
						c[k[i]] = {};
					c = c[k[i]];
				}
				if (c != null && typeof c === 'object')
					c[k[k.length - 1]] = v;
			}
			else
				lessonState[k] = v;

			window.localStorage.setItem(lessonId, JSON.stringify(lessonState));
		}
	};

	// Utility method for retrieving the state
	var getState = function(k) {
		if (Array.isArray(k)) {
			let c = lessonState;
			for (let i = 0 ; i < k.length ; i++) {
				c = c[k[i]];
				if (c == null) return null;
			}
			return c;
		}
		else if (lessonState)
			return lessonState[k];
		return null;
	};

	// Initialize the bootstrap carousel
	lesson.carousel({
		interval: false,
		wrap: false
	});

	// If there is an initial slide
	if (getState('slide') != null)
		lesson.carousel(getState('slide'));

	// Initialize the lesson
	lesson.find('.start-over').click(function() {
		lesson.carousel(0);
	});

	// Initialize tooltips
	$('[data-toggle="tooltip"]').tooltip();

	// Key controls for carousel
	document.addEventListener('keydown', function(e) {
		// If it was the left or right key, and there are no focused inputs
		if (lesson.find('.active input:focus').length == 0) {
			if (e.which == 37 || e.which == 8)
				lesson.carousel('prev');
			else if (e.which == 39 || e.which == 13)
				lesson.carousel('next');
		}
	});

	var slideTypes = ['interactive', 'question', 'learn'],
		slideTimeout;

	// Event that fires when the slide changes
	lesson.on('slide.bs.carousel', function() {
		clearTimeout(slideTimeout);

		slideTimeout = setTimeout(function() {
			var activeItem = lesson.find('.carousel-item.active');
			var type = activeItem.last().data('type');
			$('body').removeClass(slideTypes.join(' '));
			$('body').addClass(type);

			var firstInput = activeItem.last().find('input').first();
			if (firstInput) {
				firstInput.focus();
			}

			// Save the slide number
			setState('slide', activeItem.index());
		}, 750);
	});

	// Initialize with the first slide visible
	lesson.trigger('slide.bs.carousel');

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
		var uuid = item.data('uuid');

		// Ensure the input resizes with the text content
		item.find('input').each(function() {
			var input = $(this);
			var inputStatePath = ['input', uuid, input.index()];
			var inputState = getState(inputStatePath);
			var updateTimeout;

			if (inputState)
				setInput(input, inputState);

			input.keydown(function() {
				setInput(input);

				clearTimeout(updateTimeout);
				updateTimeout = setTimeout(function() {
					setState(inputStatePath, input.val());
				}, 1000);
			});
		});

		item.find('.next').click(function() {
			lesson.carousel('next');
		});

		if (type == 'interactive') {
			var inputMap = {};

			// Coordinate select elements
			var selectEls = item.find('select');
			for (let si = 0 ; si < selectEls.length ; si++) {
				$(selectEls[si]).change(function() {
					$(selectEls[(si + selectEls.length / 2) % selectEls.length]).val($(this).val());
				});
			}

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
					return input.data('expected').toLowerCase().replace(/[\.\,\!\?]/g, '') ==
						   input.val().toLowerCase().replace(/[\.\,\!\?]/g, '');
				}
			};

			var gradeButton = item.find('.grade');
			var solutionButton = item.find('.solution');
			var alreadyGradedCorrect = false;

			// If the question has already been solved
			if (getState(['correct', uuid])) {
				gradeButton.addClass('correct').text('Correct');
			}

			var gradeQuestion = function() {
				var correct = true;
				for (var i = 0 ; i < inputList.length ; i++) {
					if (inputList[i].data('expected') != null && !isCorrect(inputList[i])) {
						inputList[i].removeClass('correct').addClass('wrong');
						inputList[i].focus();
						correct = false;
						break;
					}
					else {
						inputList[i].removeClass('wrong').addClass('correct');

						// Put the exact expected answer in
						setInput(inputList[i], inputList[i].data('expected'));
					}
				}

				if (correct) {
					gradeButton.text('Correct').addClass('correct').removeClass('wrong');
					inputList[inputList.length - 1].blur();
					setState(['correct', uuid], true);
				}
				else {
					gradeButton.text('Try again').addClass('wrong').removeClass('correct');
					setState(['correct', uuid], false);
					
					setTimeout(function() {
						if (! gradeButton.hasClass('correct'))
							gradeButton.text('Check answer').removeClass('wrong');
					}, 2000);
				}
			};
			gradeButton.click(gradeQuestion);

			solutionButton.click(function() {
				inputList.forEach(function(input) {
					setInput(input, input.data('expected'));
				});
				gradeButton.click();
			});

			item.find('input').each(function() {
				var input = $(this);
				var inputIndex = inputList.length;
				inputList.push(input);
				var name = input.attr('name');

				// If the input was already marked as correct
				if (getState(['correct', uuid])) {
					input.addClass('correct');
				}

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
