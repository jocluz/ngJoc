/* jshint globalstrict: true */
'use strict';

function Scope() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
}

function initWatchVal() {}

Scope.prototype.$watch = function (watchFn, listenerFn) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {}, //$watch can be called without listener
        //JavaScript functions are so-called reference values - they are not considered equal to anything but themselves.
        last: initWatchVal
    };

    this.$$watchers.push(watcher);
};

Scope.prototype.$digest = function () {
    var ttl = 10; //Time to live
    var dirty;
    this.$$lastDirtyWatch = null;
    do {
        dirty = this.$$digestOnce();
        if (dirty && !(ttl--)) {
            throw "10 digest iterations reached";
        }
    } while (dirty);
};


Scope.prototype.$$digestOnce = function () {
    var self = this;
    var newValue, oldValue, dirty;
    var pp;

    this.$$watchers.forEach(function (watcher) {
        var newValue = watcher.watchFn(self);
        var oldValue = watcher.last;

        if (newValue !== oldValue) {
            self.$$lastDirtyWatch = watcher;
            watcher.last = newValue;
            watcher.listenerFn(newValue,
                (oldValue === initWatchVal ? newValue : oldValue),
                self);

            dirty = true;
        } else if (self.$$lastDirtyWatch === watcher) {
            pp = true;
        }

        if (pp)
            return false;
    });

    return dirty;
};