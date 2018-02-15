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
export function initPositioning (el) {
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



const moves = new Map();

/**
 * 
 * @param {HTMLElement} el
 * @param {Position} pos
 * @param {{container: HTMLElement, [padding]: Number}}
 */
export function move (el, pos, {container, padding = 0}) {
	if (container) {
		pos = constrain(el, pos, getBox(container), padding);
	}
	pos = constrain(el, pos, getWindowBox(), padding);
	
	// schedule move (if position changed)
	const curPos = getBox(el);
	if (curPos.x !== pos.x || curPos.y !== pos.y) {		// position changed
		if (!moves.get(el)) {								// no update scheduled yet
			// schedule update
			window.requestAnimationFrame(() => {
				const pos = moves.get(el);	// get _latest_ position
				
				Object.assign(el.style, {
					left:	`${pos.x}px`,
					top:	`${pos.y}px`,
				});
				
				// transform: translate gives weird artifacts in Firefox
				// this.node.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
				
				moves.delete(el);
			});
		}
		
		moves.set(el, pos);									// store _latest_ position
	}
}

/**
 * 
 * @param {HTMLElement} el
 * @param {Position} destination
 * @param {Box} container
 * @param {Number} [padding=0]
 * @return {Position}
 */
export function constrain (el, destination, container, padding = 0) {
	return {
		x: Math.max(container.x + padding, Math.min(destination.x, container.x + container.width  - padding - el.offsetWidth)),
		y: Math.max(container.y + padding, Math.min(destination.y, container.y + container.height - padding - el.offsetHeight))
	};
}
