"use strict";

/**
 * A simple math-viewing program.
 *
 * Text-format definition:
 *  * ALL objects are separated by parenthesies.
 *  * Backslashes escape the following character.
 */

function MathView()
{
	var me = this;

	me.canvas = document.createElement("canvas");
	me.ctx = document.createElement("ctx");

	me.lineHeight = 30;

	me.parse = (stringContent) =>
	{
		let baseObject = MathEditorHelper.createBaseObject();

	};
}

var MathViewHelper = {};

MathViewHelper.createBaseObject = () =>
{
	let result = {};
	
	result.subObjects = [];
	result.translation = new Vector3(0, 0); // TODO Make this just a Vector2.

	result.getWidth = (ctx) =>
	{
		return ctx.measureText("W").width;
	};

	result.getHeight = (ctx, options) =>
	{
		return options.lineHeight;
	};

	result.transformSubObjects = (ctx, subObject, index, options) =>
	{
		// No transformations are done in the default object.
	};

	result.renderChildren = (ctx, options) =>
	{
		for (let i = 0; i < result.subObjects.length; i++)
		{
			ctx.save();

			result.transformSubObjects(ctx, result.subObjects[i], i, options);

			result.subObjects[i].render(ctx, options);

			result.subObjects[i].renderChildren(ctx, options);

			ctx.restore();
		}
	};

	// Parse an initial text format
	result.parseFromTextData = (textData) =>
	{
		let currentCharacter, i, escaped, currentBlock, currentCommand;

		escaped = false;
		currentBlock = "";
		previousBlocks = [];

		currentCommand = "NO";

		for (i = 0; i < textData.length; i++)
		{
			currentCharacter = textData.charAt(i);

			// Add the current character to the current
			//block.
			currentBlock += currentCharacter;

			// Jump to the next iteration if escaped.
			if (escaped)
			{
				escaped = false;

				continue;
			}

			if (currentCharacter === '\\')
			{
				escaped = true;
			}
			else if (currentCharacter === '/')
			{
				currentBlock
			}
		}
	};

	//  Pre: The object has been translated and
	// is ready to be drawn.
	//  Post: Contents are displayed on the given
	// context.
	result.render = (ctx, options) =>
	{
		ctx.strokeRect(0, 0, result.getWidth(ctx, options), result.getHeight(ctx, options));
	};

	result.appendChild = (newSub) =>
	{
		result.subObjects.push(newSub);
	};

	return result;
};

MathViewHelper.createBaseNumber = (content) =>
{
	var result = MathEditorHelper.createBaseObject();

	result.textContent = content;

	// There should be few or no sub-objects, so
	//result.transformSubObjects is not overridden.
	result.render = (ctx, options) =>
	{
		ctx.save();

		ctx.font = options.font;
		ctx.textBaseline = "top";
		
		ctx.fillText(result.textContent, 0, 0);
		
		ctx.restore();
	};

	result.getWidth = (ctx, options) =>
	{
		return ctx.measureText(result.textContent).width;
	};

	// We should not have more than the default
	//height, so result.getHeight is left as is.
};

MathViewHelper.createFraction = (numerator, denominator) =>
{
	var result = MathEditorHelper.createBaseObject();

	// Note: The current implementation has to do with the index
	//of the object. Changing this might be worthwhile -- a change
	//to the implementation of appendChild could break this.
	result.transformSubObjects = (ctx, subObject, index, options) =>
	{
		// If in the numerator, no necessary translation.
		if (index % 2 === 0)
		{
			ctx.translate(0, 0);
		} // In the denominator? Translate 1/2 of the line's height.
		else
		{
			ctx.translate(0, options.lineHeight / 2);
		}

		ctx.scale(0.5, 0.5);
	};

	// Override the default rendering behavior.
	result.render = () =>
	{
		// For now, all rendering is done by the appended children.
	};

	// Set default values for the numerators and denominators.
	numerator = numerator || MathEditorHelper.createBaseObject();
	denominator = denominator || MathEditorHelper.createBaseObject();

	// Add the numerator and denominator to the result.
	result.appendChild(numerator);
	result.appendChild(denominator);

	return result;
};
