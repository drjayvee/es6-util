/*jshint esnext:true*/

/**
 * @typedef {Object} Position
 * @property {Number} x
 * @property {Number} y
 */

/**
 * @typedef {Object} Box
 * @property {Number} x
 * @property {Number} y
 * @property {Number} width
 * @property {Number} height
 */



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
		left:		`${pos.x}px`,
		top:		`${pos.y}px`
	});
}

/**
 * 
 * @param {HTMLElement} el
 * @param {Position} pos
 */
function setPosition (el, pos) {
	Object.assign(el.style, {
		left:	`${pos.x}px`,
		top:	`${pos.y}px`,
	});
	
	// transform: translate gives weird artifacts in Firefox
	// this.node.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}

function normalize (pos) {
	pos.x += window.pageXOffset;
	pos.y += window.pageYOffset;
	
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
	const {left: x, top: y, width, height} = el.getBoundingClientRect();
	
	return normalize({x, y, width, height});
}

/**
 * 
 * @return {Box}
 */
export function getWindowBox () {
	return {
		x:		window.pageXOffset,		// IE doesn't support window.scrollX
		y:		window.pageYOffset,		// ... or window.scrollY
		width:	window.innerWidth,
		height:	window.innerHeight
	};
}

/**
 * 
 * @param {Box} box
 * @param {Position} destination
 * @param {Box} container
 * @param {Number} [padding=0]
 * @return {Position}
 */
function constrain (box, destination, container, padding = 0) {
	return {
		x: Math.max(container.x + padding, Math.min(destination.x, container.x + container.width  - padding - box.width)),
		y: Math.max(container.y + padding, Math.min(destination.y, container.y + container.height - padding - box.height))
	};
}



const moves = new Map();
const initialied = new Map();

/**
 * 
 * @param {HTMLElement} el
 * @param {Position} pos
 * @param {{container: HTMLElement, [padding]: Number}}
 */
export function move (el, pos, {container, padding = 0} = {}) {
	if (!initialied.has(el)) {
		initPosition(el);
		initialied.set(el, true);
	}
	
	const elBox = getBox(el);
	
	if (container) {
		pos = constrain(elBox, pos, getBox(container), padding);
	}
	pos = constrain(elBox, pos, getWindowBox(), padding);
	
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
			pos.y = box.y - padding;
			break;
			
		case ALIGN_MIDDLE:
			pos.y = box.y + (box.height / 2);
			break;
			
		case ALIGN_BOTTOM:
			pos.y = box.y + box.height + padding;
			break;
			
		default:
			throw 'wrong alignment';
	}
	
	switch (alignX) {
		case ALIGN_LEFT:
			pos.x = box.x - padding;
			break;
		
		case ALIGN_CENTER:
			pos.x = box.x + (box.width / 2);
			break;
			
		case ALIGN_RIGHT:
			pos.x = box.x + box.width + padding;
			break;
			
		default:
			throw 'wrong alignment';
	}
	
	return pos;
}
// endregion

export function align (
	el,
	target,
	{
		alignment	= [ALIGN_TOP + ALIGN_CENTER, ALIGN_BOTTOM + ALIGN_CENTER],
		container	= null,
		padding		= 0,
		shift		= false,
	} = {} 
) {
	const [elAlign, targetAlign] = alignment;
	
	const elBox		= getBox(el);
	const targetBox = getBox(target);
	
	const elAlignPos		= calcAlignPos(elBox, elAlign, padding);
	const targetAlignPos	= calcAlignPos(targetBox, targetAlign, padding);
	
	const destination = {
		// new: current + (align position offset)
		x: elBox.x + (targetAlignPos.x - elAlignPos.x),
		y: elBox.y + (targetAlignPos.y - elAlignPos.y),
	};
	
	if (shift) {
		
	}
	
	move(el, destination, {container, padding});
}
