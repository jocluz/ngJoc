/* jshint globalstrict: true */
/* global cloneDeep, isEqual */
'use strict';

function Scope() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$phase = null;
}

function initWatchVal() {}

Scope.prototype.$watch = function (watchFn, listenerFn, checkByValueEq) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {}, //$watch can be called without listener
        //JavaScript functions are so-called reference values - they are not considered equal to anything but themselves.
        last: initWatchVal,
        checkByValueEq: !!checkByValueEq
    };

    this.$$watchers.push(watcher);
    // added to catch the case when adding a watch from the listener of another watch
    // it's really not necessary because in the digestOnce function 
    // im using the basic forLoop instead a forEach and the length is updated
    this.$$lastDirtyWatch = null;
};

Scope.prototype.$digest = function () {
    var ttl = 10; //Time to live
    var dirty, asyncTask;
    this.$$lastDirtyWatch = null;
    this.$beginPhase("$digest");
    do {

        // consume everything from the asyncQueue queue and invoke all the deferred functions using $eval on
        // the scope that was attached to the async task
        while (this.$$asyncQueue.length) {
            asyncTask = this.$$asyncQueue.shift();
            asyncTask.scope.$eval(asyncTask.expression);
        }

        dirty = this.$$digestOnce();
        if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
            this.$clearPhase();
            throw "10 digest iterations reached";
        }

    } while (dirty || this.$$asyncQueue.length);
    this.$clearPhase();
};

Scope.prototype.$$digestOnce = function () {
    var self = this;
    var newValue, oldValue, dirty;

    for (var index = 0; index < this.$$watchers.length; index++) {
        var watcher = this.$$watchers[index];
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;

        if (!self.$$areEqual(newValue, oldValue, watcher.checkByValueEq)) {
            self.$$lastDirtyWatch = watcher;
            watcher.last = (watcher.checkByValueEq ? cloneDeep(newValue) : newValue);
            watcher.listenerFn(newValue,
                (oldValue === initWatchVal ? newValue : oldValue),
                self);

            dirty = true;
        } else if (self.$$lastDirtyWatch === watcher) {
            return false;
        }
    }

    return dirty;
};

Scope.prototype.$eval = function (expr, locals) {
    return expr(this, locals);
};

// takes a function and schedules it to run later but still during the ongoing digest, using the $$asyncQueue
// The reason why $evalAsync is often preferrable to a $timeout with zero delay has to do with the browser event loop
Scope.prototype.$evalAsync = function (expr) {
    var self = this;
    if (!self.$$phase && !self.$$asyncQueue.length) {
        setTimeout(function () {
            if (self.$$asyncQueue.length) {
                self.$digest();
            }
        }, 0);
    }
    self.$$asyncQueue.push({
        scope: self,
        expression: expr
    });
};


Scope.prototype.$apply = function (expr, locals) {
    try {
        this.$beginPhase("$apply");
        return this.$eval(expr);
    } finally {
        this.$clearPhase();
        this.$digest();
    }
};


Scope.prototype.$beginPhase = function (phase) {
    if (this.$$phase) {
        throw this.$$phase + ' already in progress.';
    }

    this.$$phase = phase;
};

Scope.prototype.$clearPhase = function () {
    this.$$phase = null;
};



Scope.prototype.$$areEqual = function (newValue, oldValue, checkByValueEq) {
    if (checkByValueEq) {
        return isEqual(newValue, oldValue);
    }

    return newValue === oldValue ||
        (typeof newValue === 'number' &&
            typeof oldValue === 'number' &&
            isNaN(newValue) && isNaN(oldValue));
};