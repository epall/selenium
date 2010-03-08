/*
* Copyright 2004 ThoughtWorks, Inc
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

// A naming convention used in this file:
//
//
//   - a "seleniumApi" is an instance of the Selenium object, defined in selenium-api.js.
//
//   - a "Method" is an unbound function whose target must be supplied when it's called, ie.
//     it should be invoked using Function.call() or Function.apply()
//
//   - a "Block" is a function that has been bound to a target object, so can be called invoked directly
//     (or with a null target)
//
//   - "AsyncCommandHandler" is effectively an abstract base for
//     various handlers including AsyncActionHandler, AsyncAccessorHandler and AsyncAssertHandler.
//     Subclasses need to implement an execute(seleniumApi, command) function,
//     where seleniumApi is the Selenium object, and command a SeleniumCommand object.
//
//   - Handlers will return a "result" object (AsyncActionResult, AsyncAccessorResult, AsyncAssertResult).
//     AsyncActionResults may contain a .terminationCondition function which is run by 
//     -executionloop.js after the command is run; we'll run it over and over again
//     until it returns true or the .terminationCondition throws an exception.
//     AsyncAccessorResults will contain the results of running getter (e.g. getTitle returns
//     the title as a string).

var AsyncCommandHandlerFactory = classCreate();
objectExtend(AsyncCommandHandlerFactory.prototype, {

    initialize: function() {
        this.handlers = {};
    },

    registerAction: function(name, actionBlock, wait, dontCheckAlertsAndConfirms) {
        this.handlers[name] = new AsyncActionHandler(actionBlock, wait, dontCheckAlertsAndConfirms);
    },

    registerAssert: function(name, assertBlock, haltOnFailure) {
        this.handlers[name] = new AsyncAssertHandler(assertBlock, haltOnFailure);
    },

    getCommandHandler: function(name) {
        return this.handlers[name];
    },

    _registerAllAccessors: function(seleniumApi) {
        // Methods of the form getFoo(target) result in commands:
        // getFoo, assertFoo, verifyFoo, assertNotFoo, verifyNotFoo
        // storeFoo, waitForFoo, and waitForNotFoo.
        for (var functionName in seleniumApi) {
            var match = /^(get|is)([A-Z].+)$/.exec(functionName);
            if (match) {
                var accessMethod = seleniumApi[functionName];
                var accessBlock = fnBind(accessMethod, seleniumApi);
                var baseName = match[2];
                var isBoolean = (match[1] == "is");
                var requiresTarget = (accessMethod.length == 2);

                this._registerStoreCommandForAccessor(baseName, accessBlock, requiresTarget);

                var predicateBlock = this._predicateForAccessor(accessBlock, requiresTarget, isBoolean);
                this._registerAssertionsForPredicate(baseName, predicateBlock);
                this._registerWaitForCommandsForPredicate(seleniumApi, baseName, predicateBlock);
            }
        }
    },

    _registerAllActions: function(seleniumApi) {
        for (var functionName in seleniumApi) {
            var match = /^do([A-Z].+)$/.exec(functionName);
            if (match) {
                var actionName = match[1].lcfirst();
                var actionMethod = seleniumApi[functionName];
                var dontCheckPopups = actionMethod.dontCheckAlertsAndConfirms;
                var actionBlock = fnBind(actionMethod, seleniumApi);
                this.registerAction(actionName, actionBlock, false, dontCheckPopups);
                this.registerAction(actionName + "AndWait", actionBlock, true, dontCheckPopups);
            }
        }
    },

    /* no assertXXX methods present in selenium-api.js */
    _registerAllAsserts: function(seleniumApi) {
        for (var functionName in seleniumApi) {
            var match = /^assert([A-Z].+)$/.exec(functionName);
            if (match) {
                var assertBlock = fnBind(seleniumApi[functionName], seleniumApi);

                // Register the assert with the "assert" prefix, and halt on failure.
                var assertName = functionName;
                this.registerAssert(assertName, assertBlock, true);

                // Register the assert with the "verify" prefix, and do not halt on failure.
                var verifyName = "verify" + match[1];
                this.registerAssert(verifyName, assertBlock, false);
            }
        }
    },

    registerAll: function(seleniumApi) {
        this._registerAllAccessors(seleniumApi);
        this._registerAllActions(seleniumApi);
        this._registerAllAsserts(seleniumApi);
    },

    _predicateForAccessor: function(accessBlock, requiresTarget, isBoolean) {
        if (isBoolean) {
            return this._predicateForBooleanAccessor(accessBlock);
        }
        if (requiresTarget) {
            return this._predicateForSingleArgAccessor(accessBlock);
        }
        return this._predicateForNoArgAccessor(accessBlock);
    },

    _predicateForSingleArgAccessor: function(accessBlock) {
        // Given an accessor function getBlah(target),
        // return a "predicate" equivalient to isBlah(target, value) that
        // is true when the value returned by the accessor matches the specified value.
        return function(callback, target, value) {
            var ourCallback = function(accessorResult){
                if (PatternMatcher.matches(value, accessorResult)) {
                    callback(new AsyncPredicateResult(true, "Actual value '" + accessorResult + "' did match '" + value + "'"));
                } else {
                    callback(new AsyncPredicateResult(false, "Actual value '" + accessorResult + "' did not match '" + value + "'"));
                }
            };

            accessBlock(ourCallback, target);
        };
    },

    _predicateForNoArgAccessor: function(accessBlock) {
        // Given a (no-arg) accessor function getBlah(),
        // return a "predicate" equivalient to isBlah(value) that
        // is true when the value returned by the accessor matches the specified value.
        return function(callback, value) {
            var ourCallback = function(accessorResult){
                if (PatternMatcher.matches(value, accessorResult)) {
                    callback(new AsyncPredicateResult(true, "Actual value '" + accessorResult + "' did match '" + value + "'"));
                } else {
                    callback(new AsyncPredicateResult(false, "Actual value '" + accessorResult + "' did not match '" + value + "'"));
                }
            };

            accessBlock(ourCallback);
        };
    },

    _predicateForBooleanAccessor: function(accessBlock) {
        // Given a boolean accessor function isBlah(),
        // return a "predicate" equivalient to isBlah() that
        // returns an appropriate AsyncPredicateResult value.
        return function() {
            var callback = arguments[0];
            var ourCallback = function(accessorResult){
                if(accessorResult){
                    callback(new AsyncPredicateResult(true, "true"));
                } else {
                    callback(new AsyncPredicateResult(false, "false"));
                }
            };

            if (arguments.length > 3) throw new SeleniumError("Too many arguments! " + arguments.length);
            if (arguments.length == 3) {
                 accessBlock(ourCallback, arguments[1], arguments[2]);
            } else if (arguments.length == 2) {
                accessBlock(ourCallback, arguments[1]);
            } else {
                accessBlock(ourCallback);
            }
        };
    },

    _invertPredicate: function(predicateBlock) {
        // Given a predicate, return the negation of that predicate.
        // Leaves the message unchanged.
        // Used to create assertNot, verifyNot, and waitForNot commands.
        return function(callback, target, value) {
            predicateBlock(function(result){
                result.isTrue = !result.isTrue;
                callback(result);
            }, target, value);
        };
    },

    createAssertionFromPredicate: function(predicateBlock) {
        // Convert an isBlahBlah(target, value) function into an assertBlahBlah(target, value) function.

        return function(resultHolder, haltOnFailure, target, value) {
            var setResult = function(result){
                if(!result.isTrue){
                    resultHolder.setFailed(result.message);
                    if(haltOnFailure){
                        currentTest.handleAsyncError(new Error(), result.message);
                    }
                }
                currentTest.resumeFromCallback();
            }
            predicateBlock(setResult, target, value);
        };
    },

    _invertPredicateName: function(baseName) {
        var matchResult = /^(.*)Present$/.exec(baseName);
        if (matchResult != null) {
            return matchResult[1] + "NotPresent";
        }
        return "Not" + baseName;
    },

    /* This is the big time */
    _registerAssertionsForPredicate: function(baseName, predicateBlock) {
        // Register an assertion, a verification, a negative assertion,
        // and a negative verification based on the specified accessor.
        var assertBlock = this.createAssertionFromPredicate(predicateBlock);
        this.registerAssert("assert" + baseName, assertBlock, true);
        this.registerAssert("verify" + baseName, assertBlock, false);

        var invertedPredicateBlock = this._invertPredicate(predicateBlock);
        var negativeassertBlock = this.createAssertionFromPredicate(invertedPredicateBlock);
        this.registerAssert("assert" + this._invertPredicateName(baseName), negativeassertBlock, true);
        this.registerAssert("verify" + this._invertPredicateName(baseName), negativeassertBlock, false);
    },

    _waitForActionForPredicate: function(predicateBlock) {
        // Convert an isBlahBlah(target, value) function into a waitForBlahBlah(target, value) function.
        return function(target, value) {
            var state = "init";
            var result = null;
            
            var updateResult = function(predicateResult){
                result = predicateResult.isTrue;
                state = "retrieved";
            }
            
            var terminationCondition = function () {
                switch(state){
                    case "init":
                    predicateBlock(updateResult, target, value);
                    state = "waiting";
                    return false;
                    
                    case "waiting":
                    return false;
                    
                    case "retrieved":
                    if(result){
                        return true;
                    } else {
                        state = "init";
                        return false;
                    }
                }
            };
            setTimeout(fnBind(currentTest.resumeFromCallback, currentTest), 0);
            return Selenium.decorateFunctionWithTimeout(terminationCondition, this.defaultTimeout);
        };
    },

    _registerWaitForCommandsForPredicate: function(seleniumApi, baseName, predicateBlock) {
        // Register a waitForBlahBlah and waitForNotBlahBlah based on the specified accessor.
        var waitForActionMethod = this._waitForActionForPredicate(predicateBlock);
        var waitForActionBlock = fnBind(waitForActionMethod, seleniumApi);
        
        var invertedPredicateBlock = this._invertPredicate(predicateBlock);
        var waitForNotActionMethod = this._waitForActionForPredicate(invertedPredicateBlock);
        var waitForNotActionBlock = fnBind(waitForNotActionMethod, seleniumApi);
        
        this.registerAction("waitFor" + baseName, waitForActionBlock, false, true);
        this.registerAction("waitFor" + this._invertPredicateName(baseName), waitForNotActionBlock, false, true);
        //TODO decide remove "waitForNot.*Present" action name or not
        //for the back compatiblity issues we still make waitForNot.*Present availble
        this.registerAction("waitForNot" + baseName, waitForNotActionBlock, false, true);
    },

    _registerStoreCommandForAccessor: function(baseName, accessBlock, requiresTarget) {
        var action = function(target, varName) {
            accessBlock(function(result){
                storedVars[varName] = result;
                currentTest.resumeFromCallback();
            }, target);
        }

        this.registerAction("store" + baseName, action, false, true);
    }
});

function AsyncPredicateResult(isTrue, message) {
    this.isTrue = isTrue;
    this.message = message;
}

// NOTE: The AsyncCommandHandler is effectively an abstract base for
// various handlers including AsyncActionHandler, AsyncAccessorHandler and AsyncAssertHandler.
// Subclasses need to implement an execute(seleniumApi, command) function,
// where seleniumApi is the Selenium object, and command a SeleniumCommand object.
function AsyncCommandHandler(type, haltOnFailure) {
    this.type = type;
    this.haltOnFailure = haltOnFailure;
}

// An AsyncActionHandler is a command handler that executes the sepcified action,
// possibly checking for alerts and confirmations (if checkAlerts is set), and
// possibly waiting for a page load if wait is set.
function AsyncActionHandler(actionBlock, wait, dontCheckAlerts) {
    this.actionBlock = actionBlock;
    AsyncCommandHandler.call(this, "action", true);
    if (wait) {
        this.wait = true;
    }
    // note that dontCheckAlerts could be undefined!!!
    this.checkAlerts = (dontCheckAlerts) ? false : true;
}
AsyncActionHandler.prototype = new AsyncCommandHandler;
AsyncActionHandler.prototype.execute = function(seleniumApi, command) {
    if (this.checkAlerts && (null == /(Alert|Confirmation)(Not)?Present/.exec(command.command))) {
        // todo: this conditional logic is ugly
        seleniumApi.ensureNoUnhandledPopups();
    }
    
    var handlerCondition = this.actionBlock(command.target, command.value);
    
    // page load waiting takes precedence over any wait condition returned by
    // the action handler.
    var terminationCondition = (this.wait)
        ? seleniumApi.makePageLoadCondition() : handlerCondition;
    
    return new AsyncActionResult(terminationCondition);
};

function AsyncActionResult(terminationCondition) {
    this.terminationCondition = terminationCondition;
}

/**
 * Handler for assertions and verifications.
 */
function AsyncAssertHandler(assertBlock, haltOnFailure) {
    this.assertBlock = assertBlock;
    AsyncCommandHandler.call(this, "assert", haltOnFailure || false);
}
AsyncAssertHandler.prototype = new AsyncCommandHandler;
AsyncAssertHandler.prototype.execute = function(seleniumApi, command) {
    var result = new AsyncAssertResult();
    this.assertBlock(result, this.haltOnFailure, command.target, command.value);
    return result;
};

function AsyncAssertResult() {
    this.passed = true;
}
AsyncAssertResult.prototype.setFailed = function(message) {
    this.passed = null;
    this.failed = true;
    this.failureMessage = message;
}
