'use strict';

const expressions = require('../expressions');
const Flow = require('./Flow');
const scriptHelper = require('../script-helper');

function SequenceFlow(activity) {
  this.condition = getCondition.call(this, activity.element);
  Flow.apply(this, arguments);
  this.isDefault = this.parentContext.isDefaultSequenceFlow(this.id);
}

SequenceFlow.prototype = Object.create(Flow.prototype);

SequenceFlow.prototype.executeCondition = function(context) {
  const result = this.condition.execute(context);
  this._debug(`<${this.id}>`, `condition result evaluated to ${result}`, context);
  return result;
};

SequenceFlow.prototype.evaluateCondition = function(input) {
  if (this.condition) {
    const executionContext = this.parentContext.getFrozenVariablesAndServices(Object.assign({flowId: this.id}, input || {}));
    return this.executeCondition(executionContext);
  }
  return true;
};

function getCondition(element) {
  if (!element.conditionExpression) return null;

  if (!element.conditionExpression.hasOwnProperty('language')) {
    return new ExpressionCondition(element.conditionExpression.body);
  }

  if (!scriptHelper.isJavascript(element.conditionExpression.language)) throw Error(`Script format ${element.conditionExpression.language} is unsupported (<${element.id}>)`);

  return new ScriptCondition(scriptHelper.parse(`${element.id}.condition`, element.conditionExpression.body));
}

function ScriptCondition(script) {
  this.execute = (executionContext) => {
    return scriptHelper.execute(script, executionContext);
  };
}

function ExpressionCondition(expression) {
  this.execute = (executionContext) => {
    return expressions(expression, executionContext);
  };
}

module.exports = SequenceFlow;
