/*jshint esnext:true*/

/**
 * @typedef {Object} Position
 * @property {Number} x
 * @property {Number} y
 */

/**
 * @typedef {Object} Box
 * @property {Number} left
 * @property {Number} right
 * @property {Number} top
 * @property {Number} bottom
 * @property {Number} width
 * @property {Number} height
 */


// region utilities
/**
 * 
 * @param {HTMLElement} el
 */
function initPosition (el) {
	const pos = getPosition(el);
	
	if (el.parentNode.nodeName !== "BODY") {			// if not already child of <body>
		document.querySelector('body').appendChild(el);		// move it there to make position: absolute actually 'absolute'
	}
	
	Object.assign(el.style, {
		position:	'absolute',
		left:		pos.x + 'px',
		top:		pos.y + 'px'
	});
}

/**
 * 
 * @param {HTMLElement} el
 * @param {Position} pos
 */
function setPosition (el, pos) {
	Object.assign(el.style, {
		left:	pos.x + 'px',
		top:	pos.y + 'px',
	});
	
	// transform: translate gives weird artifacts in Firefox
	// this.node.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}

/**
 * 
 * @param {Box|Position} pos
 * @return {Box|Position}
 */
function normalize (pos) {
	if (pos instanceof window.DOMRect) {
		pos = {
			left:	pos.left,
			right:	pos.right,
			top:	pos.top,
			bottom:	pos.bottom,
			width:	pos.width,
			height:	pos.height
		};
	}
	
	const [xAisPropertyName, yAisPropertyName] = ('left' in pos) ? ['left', 'top'] : ['x', 'y'];
	pos[xAisPropertyName] += window.pageXOffset;
	pos[yAisPropertyName] += window.pageYOffset;
	
	return pos;
}

/**
 * 
 * @param {HTMLElement|MouseEvent} e
 * @return {Position}
 */
export function getPosition (e) {
	if (e instanceof HTMLElement) {
		const rect = e.getBoundingClientRect();
		return normalize({
			x: rect.left,
			y: rect.top
		});
	} else if (e instanceof MouseEvent) {
		return normalize({
			x: e.clientX,
			y: e.clientY
		});
	} else {
		throw 'Invalid argument type';
	}
}

/**
 * 
 * @param {HTMLElement} el
 * @return {Box}
 */
export function getBox (el) {
	return normalize(el.getBoundingClientRect());
}

/**
 * 
 * @return {Box}
 */
export function getWindowBox () {
	return {
		left:	window.pageXOffset,		// IE doesn't support window.scrollX
		right:	window.pageXOffset + window.innerWidth,
		top:	window.pageYOffset,		// ... or window.scrollY
		bottom:	window.pageYOffset + window.innerHeight,
		width:	window.innerWidth,
		height:	window.innerHeight
	};
}
// endregion

// region constrain calculation
/**
 * 
 * @param {Box} box
 * @param {Position} destination
 * @param {Box} container
 * @param {Number} padding
 * @return {Position}
 */
function constrain (box, destination, container, padding) {
	return {
		x: Math.max(container.left + padding, Math.min(destination.x, container.right  - padding - box.width)),
		y: Math.max(container.top + padding,  Math.min(destination.y, container.bottom - padding - box.height))
	};
}

const initialied = new Map();

function constrainPosition (el, pos, container, padding) {
	if (!initialied.has(el)) {
		initPosition(el);
		initialied.set(el, true);
	}
	
	const elBox = getBox(el);
	
	if (container) {
		pos = constrain(elBox, pos, getBox(container), padding);
	}
	pos = constrain(elBox, pos, getWindowBox(), padding);
	
	return pos;
}

const moves = new Map();

function scheduleMove (el, pos) {
	// schedule move (if position changed)
	const curPos = getBox(el);
	if (curPos.x !== pos.x || curPos.y !== pos.y) {		// position changed
		if (!moves.get(el)) {								// no update scheduled yet
			// schedule update
			window.requestAnimationFrame(() => {
				setPosition(el, moves.get(el));	// move to _latest_ position
				moves.delete(el);
			});
		}
		
		moves.set(el, pos);									// store _latest_ position
	}
}
// endregion

// region alignment calculation
const ALIGN_LEFT	= 'l';
const ALIGN_CENTER	= 'c';
const ALIGN_RIGHT	= 'r';

const ALIGN_TOP		= 't';
const ALIGN_MIDDLE	= 'm';
const ALIGN_BOTTOM	= 'b';

/**
 * 
 * @param {Box} box
 * @param {String[]} align
 * @param {Number} padding
 * @return {Position}
 */
function calcAlignPos (box, align, padding = 0) {
	const [alignY, alignX] = align;
	
	const pos = {x: 0, y: 0};
	
	switch (alignY) {
		case ALIGN_TOP:
			pos.y = box.top - padding;
			break;
			
		case ALIGN_MIDDLE:
			pos.y = box.top + (box.height / 2);
			break;
			
		case ALIGN_BOTTOM:
			pos.y = box.bottom + padding;
			break;
			
		default:
			throw 'wrong alignment';
	}
	
	switch (alignX) {
		case ALIGN_LEFT:
			pos.x = box.left - padding;
			break;
		
		case ALIGN_CENTER:
			pos.x = box.left + (box.width / 2);
			break;
			
		case ALIGN_RIGHT:
			pos.x = box.right + padding;
			break;
			
		default:
			throw 'wrong alignment';
	}
	
	return pos;
}

/**
 * 
 * @param {Box} elBox
 * @param {Position} destination
 * @param {Box} targetBox
 * @param {String} targetAlign
 * @param {Number} padding
 * @return {Position}
 */
function flipAlignment (elBox, destination, targetBox, targetAlign, padding) {
	const [verticalAlign, horizontalAlign] = targetAlign;
	
	const destinationBox = Object.assign({}, elBox, destination, {
		right: destination.x + elBox.width,
		bottom: destination.y + elBox.height
	});
	
	// flip left/right
	if (
		horizontalAlign === ALIGN_LEFT &&
		destinationBox.right > targetBox.left
	) {
		destination.x = targetBox.right + padding;
	} else if (
		horizontalAlign === ALIGN_RIGHT &&
		destinationBox.left < targetBox.right
	) {
		destination.x = targetBox.left - destinationBox.width - padding;
	}
	
	// flip up/down
	else if (
		verticalAlign === ALIGN_TOP &&
		destinationBox.bottom > targetBox.top
	) {
		destination.y = targetBox.bottom + padding;
	} else if (
		horizontalAlign === ALIGN_BOTTOM &&
		destinationBox.top < targetBox.bottom
	) {
		destination.y = targetBox.top - destinationBox.height - padding;
	}
	
	return destination;
}
// endregion

// region exported functions
/**
 * 
 * @param {HTMLElement} el
 * @param {Position} pos
 * @param {{container: HTMLElement, [padding]: Number}}
 */
export function move (el, pos, {container, padding = 0} = {}) {
	scheduleMove(el, constrainPosition(el, pos, container, padding));
}

/**
 * 
 * @param {HTMLElement} el
 * @param {HTMLElement|Window} target
 * @param {String[]} alignment
 * @param {HTMLElement} [container]
 * @param {Number} [padding=0]
 * @param {Boolean] [flip=false]
 */
export function align (
	el,
	target,
	{
		alignment	= [ALIGN_TOP + ALIGN_CENTER, ALIGN_BOTTOM + ALIGN_CENTER],
		container	= null,
		padding		= 0,
		flip		= false,
	} = {} 
) {
	const [elAlign, targetAlign] = alignment;
	
	const elBox		= getBox(el);
	const targetBox = target === window ? getWindowBox() : getBox(target);
	
	// perform alignment calculations
	const elAlignPos		= calcAlignPos(elBox, elAlign, padding);
	const targetAlignPos	= calcAlignPos(targetBox, targetAlign, padding);
	
	let destination = {
		// new: current + (align position offset)
		x: elBox.left + (targetAlignPos.x - elAlignPos.x),
		y: elBox.top + (targetAlignPos.y - elAlignPos.y),
	};
	
	// constrain destination position
	destination = constrainPosition(el, destination, container, padding);
	
	// flip alignment if el (partially or completely) overlaps target
	if (flip) {
		destination = flipAlignment(elBox, destination, targetBox, targetAlign, padding);
	}
	
	scheduleMove(el, destination);
}

export function center (el) {
	align(el, window, {alignment: ['mc', 'mc']});
}
// endregion
