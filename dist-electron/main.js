import { createRequire } from "node:module";
import electron, { BrowserWindow, app, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process$1 from "node:process";
import fs from "node:fs";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res, err) => () => {
	if (err) throw err[0];
	try {
		return fn && (res = fn(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
//#endregion
//#region node_modules/universalify/index.js
var require_universalify = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.fromCallback = function(fn) {
		return Object.defineProperty(function(...args) {
			if (typeof args[args.length - 1] === "function") fn.apply(this, args);
			else return new Promise((resolve, reject) => {
				args.push((err, res) => err != null ? reject(err) : resolve(res));
				fn.apply(this, args);
			});
		}, "name", { value: fn.name });
	};
	exports.fromPromise = function(fn) {
		return Object.defineProperty(function(...args) {
			const cb = args[args.length - 1];
			if (typeof cb !== "function") return fn.apply(this, args);
			else {
				args.pop();
				fn.apply(this, args).then((r) => cb(null, r), cb);
			}
		}, "name", { value: fn.name });
	};
}));
//#endregion
//#region node_modules/graceful-fs/polyfills.js
var require_polyfills = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var constants = __require("constants");
	var origCwd = process.cwd;
	var cwd = null;
	var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
	process.cwd = function() {
		if (!cwd) cwd = origCwd.call(process);
		return cwd;
	};
	try {
		process.cwd();
	} catch (er) {}
	if (typeof process.chdir === "function") {
		var chdir = process.chdir;
		process.chdir = function(d) {
			cwd = null;
			chdir.call(process, d);
		};
		if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
	}
	module.exports = patch;
	function patch(fs) {
		if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) patchLchmod(fs);
		if (!fs.lutimes) patchLutimes(fs);
		fs.chown = chownFix(fs.chown);
		fs.fchown = chownFix(fs.fchown);
		fs.lchown = chownFix(fs.lchown);
		fs.chmod = chmodFix(fs.chmod);
		fs.fchmod = chmodFix(fs.fchmod);
		fs.lchmod = chmodFix(fs.lchmod);
		fs.chownSync = chownFixSync(fs.chownSync);
		fs.fchownSync = chownFixSync(fs.fchownSync);
		fs.lchownSync = chownFixSync(fs.lchownSync);
		fs.chmodSync = chmodFixSync(fs.chmodSync);
		fs.fchmodSync = chmodFixSync(fs.fchmodSync);
		fs.lchmodSync = chmodFixSync(fs.lchmodSync);
		fs.stat = statFix(fs.stat);
		fs.fstat = statFix(fs.fstat);
		fs.lstat = statFix(fs.lstat);
		fs.statSync = statFixSync(fs.statSync);
		fs.fstatSync = statFixSync(fs.fstatSync);
		fs.lstatSync = statFixSync(fs.lstatSync);
		if (fs.chmod && !fs.lchmod) {
			fs.lchmod = function(path, mode, cb) {
				if (cb) process.nextTick(cb);
			};
			fs.lchmodSync = function() {};
		}
		if (fs.chown && !fs.lchown) {
			fs.lchown = function(path, uid, gid, cb) {
				if (cb) process.nextTick(cb);
			};
			fs.lchownSync = function() {};
		}
		if (platform === "win32") fs.rename = typeof fs.rename !== "function" ? fs.rename : (function(fs$rename) {
			function rename(from, to, cb) {
				var start = Date.now();
				var backoff = 0;
				fs$rename(from, to, function CB(er) {
					if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
						setTimeout(function() {
							fs.stat(to, function(stater, st) {
								if (stater && stater.code === "ENOENT") fs$rename(from, to, CB);
								else cb(er);
							});
						}, backoff);
						if (backoff < 100) backoff += 10;
						return;
					}
					if (cb) cb(er);
				});
			}
			if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
			return rename;
		})(fs.rename);
		fs.read = typeof fs.read !== "function" ? fs.read : (function(fs$read) {
			function read(fd, buffer, offset, length, position, callback_) {
				var callback;
				if (callback_ && typeof callback_ === "function") {
					var eagCounter = 0;
					callback = function(er, _, __) {
						if (er && er.code === "EAGAIN" && eagCounter < 10) {
							eagCounter++;
							return fs$read.call(fs, fd, buffer, offset, length, position, callback);
						}
						callback_.apply(this, arguments);
					};
				}
				return fs$read.call(fs, fd, buffer, offset, length, position, callback);
			}
			if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
			return read;
		})(fs.read);
		fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : (function(fs$readSync) {
			return function(fd, buffer, offset, length, position) {
				var eagCounter = 0;
				while (true) try {
					return fs$readSync.call(fs, fd, buffer, offset, length, position);
				} catch (er) {
					if (er.code === "EAGAIN" && eagCounter < 10) {
						eagCounter++;
						continue;
					}
					throw er;
				}
			};
		})(fs.readSync);
		function patchLchmod(fs) {
			fs.lchmod = function(path, mode, callback) {
				fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function(err, fd) {
					if (err) {
						if (callback) callback(err);
						return;
					}
					fs.fchmod(fd, mode, function(err) {
						fs.close(fd, function(err2) {
							if (callback) callback(err || err2);
						});
					});
				});
			};
			fs.lchmodSync = function(path, mode) {
				var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
				var threw = true;
				var ret;
				try {
					ret = fs.fchmodSync(fd, mode);
					threw = false;
				} finally {
					if (threw) try {
						fs.closeSync(fd);
					} catch (er) {}
					else fs.closeSync(fd);
				}
				return ret;
			};
		}
		function patchLutimes(fs) {
			if (constants.hasOwnProperty("O_SYMLINK") && fs.futimes) {
				fs.lutimes = function(path, at, mt, cb) {
					fs.open(path, constants.O_SYMLINK, function(er, fd) {
						if (er) {
							if (cb) cb(er);
							return;
						}
						fs.futimes(fd, at, mt, function(er) {
							fs.close(fd, function(er2) {
								if (cb) cb(er || er2);
							});
						});
					});
				};
				fs.lutimesSync = function(path, at, mt) {
					var fd = fs.openSync(path, constants.O_SYMLINK);
					var ret;
					var threw = true;
					try {
						ret = fs.futimesSync(fd, at, mt);
						threw = false;
					} finally {
						if (threw) try {
							fs.closeSync(fd);
						} catch (er) {}
						else fs.closeSync(fd);
					}
					return ret;
				};
			} else if (fs.futimes) {
				fs.lutimes = function(_a, _b, _c, cb) {
					if (cb) process.nextTick(cb);
				};
				fs.lutimesSync = function() {};
			}
		}
		function chmodFix(orig) {
			if (!orig) return orig;
			return function(target, mode, cb) {
				return orig.call(fs, target, mode, function(er) {
					if (chownErOk(er)) er = null;
					if (cb) cb.apply(this, arguments);
				});
			};
		}
		function chmodFixSync(orig) {
			if (!orig) return orig;
			return function(target, mode) {
				try {
					return orig.call(fs, target, mode);
				} catch (er) {
					if (!chownErOk(er)) throw er;
				}
			};
		}
		function chownFix(orig) {
			if (!orig) return orig;
			return function(target, uid, gid, cb) {
				return orig.call(fs, target, uid, gid, function(er) {
					if (chownErOk(er)) er = null;
					if (cb) cb.apply(this, arguments);
				});
			};
		}
		function chownFixSync(orig) {
			if (!orig) return orig;
			return function(target, uid, gid) {
				try {
					return orig.call(fs, target, uid, gid);
				} catch (er) {
					if (!chownErOk(er)) throw er;
				}
			};
		}
		function statFix(orig) {
			if (!orig) return orig;
			return function(target, options, cb) {
				if (typeof options === "function") {
					cb = options;
					options = null;
				}
				function callback(er, stats) {
					if (stats) {
						if (stats.uid < 0) stats.uid += 4294967296;
						if (stats.gid < 0) stats.gid += 4294967296;
					}
					if (cb) cb.apply(this, arguments);
				}
				return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
			};
		}
		function statFixSync(orig) {
			if (!orig) return orig;
			return function(target, options) {
				var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
				if (stats) {
					if (stats.uid < 0) stats.uid += 4294967296;
					if (stats.gid < 0) stats.gid += 4294967296;
				}
				return stats;
			};
		}
		function chownErOk(er) {
			if (!er) return true;
			if (er.code === "ENOSYS") return true;
			if (!process.getuid || process.getuid() !== 0) {
				if (er.code === "EINVAL" || er.code === "EPERM") return true;
			}
			return false;
		}
	}
}));
//#endregion
//#region node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Stream = __require("stream").Stream;
	module.exports = legacy;
	function legacy(fs) {
		return {
			ReadStream,
			WriteStream
		};
		function ReadStream(path, options) {
			if (!(this instanceof ReadStream)) return new ReadStream(path, options);
			Stream.call(this);
			var self = this;
			this.path = path;
			this.fd = null;
			this.readable = true;
			this.paused = false;
			this.flags = "r";
			this.mode = 438;
			this.bufferSize = 65536;
			options = options || {};
			var keys = Object.keys(options);
			for (var index = 0, length = keys.length; index < length; index++) {
				var key = keys[index];
				this[key] = options[key];
			}
			if (this.encoding) this.setEncoding(this.encoding);
			if (this.start !== void 0) {
				if ("number" !== typeof this.start) throw TypeError("start must be a Number");
				if (this.end === void 0) this.end = Infinity;
				else if ("number" !== typeof this.end) throw TypeError("end must be a Number");
				if (this.start > this.end) throw new Error("start must be <= end");
				this.pos = this.start;
			}
			if (this.fd !== null) {
				process.nextTick(function() {
					self._read();
				});
				return;
			}
			fs.open(this.path, this.flags, this.mode, function(err, fd) {
				if (err) {
					self.emit("error", err);
					self.readable = false;
					return;
				}
				self.fd = fd;
				self.emit("open", fd);
				self._read();
			});
		}
		function WriteStream(path, options) {
			if (!(this instanceof WriteStream)) return new WriteStream(path, options);
			Stream.call(this);
			this.path = path;
			this.fd = null;
			this.writable = true;
			this.flags = "w";
			this.encoding = "binary";
			this.mode = 438;
			this.bytesWritten = 0;
			options = options || {};
			var keys = Object.keys(options);
			for (var index = 0, length = keys.length; index < length; index++) {
				var key = keys[index];
				this[key] = options[key];
			}
			if (this.start !== void 0) {
				if ("number" !== typeof this.start) throw TypeError("start must be a Number");
				if (this.start < 0) throw new Error("start must be >= zero");
				this.pos = this.start;
			}
			this.busy = false;
			this._queue = [];
			if (this.fd === null) {
				this._open = fs.open;
				this._queue.push([
					this._open,
					this.path,
					this.flags,
					this.mode,
					void 0
				]);
				this.flush();
			}
		}
	}
}));
//#endregion
//#region node_modules/graceful-fs/clone.js
var require_clone = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = clone;
	var getPrototypeOf = Object.getPrototypeOf || function(obj) {
		return obj.__proto__;
	};
	function clone(obj) {
		if (obj === null || typeof obj !== "object") return obj;
		if (obj instanceof Object) var copy = { __proto__: getPrototypeOf(obj) };
		else var copy = Object.create(null);
		Object.getOwnPropertyNames(obj).forEach(function(key) {
			Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
		});
		return copy;
	}
}));
//#endregion
//#region node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs$1 = __require("fs");
	var polyfills = require_polyfills();
	var legacy = require_legacy_streams();
	var clone = require_clone();
	var util$2 = __require("util");
	/* istanbul ignore next - node 0.x polyfill */
	var gracefulQueue;
	var previousSymbol;
	/* istanbul ignore else - node 0.x polyfill */
	if (typeof Symbol === "function" && typeof Symbol.for === "function") {
		gracefulQueue = Symbol.for("graceful-fs.queue");
		previousSymbol = Symbol.for("graceful-fs.previous");
	} else {
		gracefulQueue = "___graceful-fs.queue";
		previousSymbol = "___graceful-fs.previous";
	}
	function noop() {}
	function publishQueue(context, queue) {
		Object.defineProperty(context, gracefulQueue, { get: function() {
			return queue;
		} });
	}
	var debug = noop;
	if (util$2.debuglog) debug = util$2.debuglog("gfs4");
	else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) debug = function() {
		var m = util$2.format.apply(util$2, arguments);
		m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
		console.error(m);
	};
	if (!fs$1[gracefulQueue]) {
		publishQueue(fs$1, global[gracefulQueue] || []);
		fs$1.close = (function(fs$close) {
			function close(fd, cb) {
				return fs$close.call(fs$1, fd, function(err) {
					if (!err) resetQueue();
					if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
			Object.defineProperty(close, previousSymbol, { value: fs$close });
			return close;
		})(fs$1.close);
		fs$1.closeSync = (function(fs$closeSync) {
			function closeSync(fd) {
				fs$closeSync.apply(fs$1, arguments);
				resetQueue();
			}
			Object.defineProperty(closeSync, previousSymbol, { value: fs$closeSync });
			return closeSync;
		})(fs$1.closeSync);
		if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) process.on("exit", function() {
			debug(fs$1[gracefulQueue]);
			__require("assert").equal(fs$1[gracefulQueue].length, 0);
		});
	}
	if (!global[gracefulQueue]) publishQueue(global, fs$1[gracefulQueue]);
	module.exports = patch(clone(fs$1));
	if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$1.__patched) {
		module.exports = patch(fs$1);
		fs$1.__patched = true;
	}
	function patch(fs) {
		polyfills(fs);
		fs.gracefulify = patch;
		fs.createReadStream = createReadStream;
		fs.createWriteStream = createWriteStream;
		var fs$readFile = fs.readFile;
		fs.readFile = readFile;
		function readFile(path, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			return go$readFile(path, options, cb);
			function go$readFile(path, options, cb, startTime) {
				return fs$readFile(path, options, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$readFile,
						[
							path,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$writeFile = fs.writeFile;
		fs.writeFile = writeFile;
		function writeFile(path, data, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			return go$writeFile(path, data, options, cb);
			function go$writeFile(path, data, options, cb, startTime) {
				return fs$writeFile(path, data, options, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$writeFile,
						[
							path,
							data,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$appendFile = fs.appendFile;
		if (fs$appendFile) fs.appendFile = appendFile;
		function appendFile(path, data, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			return go$appendFile(path, data, options, cb);
			function go$appendFile(path, data, options, cb, startTime) {
				return fs$appendFile(path, data, options, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$appendFile,
						[
							path,
							data,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$copyFile = fs.copyFile;
		if (fs$copyFile) fs.copyFile = copyFile;
		function copyFile(src, dest, flags, cb) {
			if (typeof flags === "function") {
				cb = flags;
				flags = 0;
			}
			return go$copyFile(src, dest, flags, cb);
			function go$copyFile(src, dest, flags, cb, startTime) {
				return fs$copyFile(src, dest, flags, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$copyFile,
						[
							src,
							dest,
							flags,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$readdir = fs.readdir;
		fs.readdir = readdir;
		var noReaddirOptionVersions = /^v[0-5]\./;
		function readdir(path, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir(path, options, cb, startTime) {
				return fs$readdir(path, fs$readdirCallback(path, options, cb, startTime));
			} : function go$readdir(path, options, cb, startTime) {
				return fs$readdir(path, options, fs$readdirCallback(path, options, cb, startTime));
			};
			return go$readdir(path, options, cb);
			function fs$readdirCallback(path, options, cb, startTime) {
				return function(err, files) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$readdir,
						[
							path,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else {
						if (files && files.sort) files.sort();
						if (typeof cb === "function") cb.call(this, err, files);
					}
				};
			}
		}
		if (process.version.substr(0, 4) === "v0.8") {
			var legStreams = legacy(fs);
			ReadStream = legStreams.ReadStream;
			WriteStream = legStreams.WriteStream;
		}
		var fs$ReadStream = fs.ReadStream;
		if (fs$ReadStream) {
			ReadStream.prototype = Object.create(fs$ReadStream.prototype);
			ReadStream.prototype.open = ReadStream$open;
		}
		var fs$WriteStream = fs.WriteStream;
		if (fs$WriteStream) {
			WriteStream.prototype = Object.create(fs$WriteStream.prototype);
			WriteStream.prototype.open = WriteStream$open;
		}
		Object.defineProperty(fs, "ReadStream", {
			get: function() {
				return ReadStream;
			},
			set: function(val) {
				ReadStream = val;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(fs, "WriteStream", {
			get: function() {
				return WriteStream;
			},
			set: function(val) {
				WriteStream = val;
			},
			enumerable: true,
			configurable: true
		});
		var FileReadStream = ReadStream;
		Object.defineProperty(fs, "FileReadStream", {
			get: function() {
				return FileReadStream;
			},
			set: function(val) {
				FileReadStream = val;
			},
			enumerable: true,
			configurable: true
		});
		var FileWriteStream = WriteStream;
		Object.defineProperty(fs, "FileWriteStream", {
			get: function() {
				return FileWriteStream;
			},
			set: function(val) {
				FileWriteStream = val;
			},
			enumerable: true,
			configurable: true
		});
		function ReadStream(path, options) {
			if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this;
			else return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
		}
		function ReadStream$open() {
			var that = this;
			open(that.path, that.flags, that.mode, function(err, fd) {
				if (err) {
					if (that.autoClose) that.destroy();
					that.emit("error", err);
				} else {
					that.fd = fd;
					that.emit("open", fd);
					that.read();
				}
			});
		}
		function WriteStream(path, options) {
			if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this;
			else return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
		}
		function WriteStream$open() {
			var that = this;
			open(that.path, that.flags, that.mode, function(err, fd) {
				if (err) {
					that.destroy();
					that.emit("error", err);
				} else {
					that.fd = fd;
					that.emit("open", fd);
				}
			});
		}
		function createReadStream(path, options) {
			return new fs.ReadStream(path, options);
		}
		function createWriteStream(path, options) {
			return new fs.WriteStream(path, options);
		}
		var fs$open = fs.open;
		fs.open = open;
		function open(path, flags, mode, cb) {
			if (typeof mode === "function") cb = mode, mode = null;
			return go$open(path, flags, mode, cb);
			function go$open(path, flags, mode, cb, startTime) {
				return fs$open(path, flags, mode, function(err, fd) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$open,
						[
							path,
							flags,
							mode,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		return fs;
	}
	function enqueue(elem) {
		debug("ENQUEUE", elem[0].name, elem[1]);
		fs$1[gracefulQueue].push(elem);
		retry();
	}
	var retryTimer;
	function resetQueue() {
		var now = Date.now();
		for (var i = 0; i < fs$1[gracefulQueue].length; ++i) if (fs$1[gracefulQueue][i].length > 2) {
			fs$1[gracefulQueue][i][3] = now;
			fs$1[gracefulQueue][i][4] = now;
		}
		retry();
	}
	function retry() {
		clearTimeout(retryTimer);
		retryTimer = void 0;
		if (fs$1[gracefulQueue].length === 0) return;
		var elem = fs$1[gracefulQueue].shift();
		var fn = elem[0];
		var args = elem[1];
		var err = elem[2];
		var startTime = elem[3];
		var lastTime = elem[4];
		if (startTime === void 0) {
			debug("RETRY", fn.name, args);
			fn.apply(null, args);
		} else if (Date.now() - startTime >= 6e4) {
			debug("TIMEOUT", fn.name, args);
			var cb = args.pop();
			if (typeof cb === "function") cb.call(null, err);
		} else {
			var sinceAttempt = Date.now() - lastTime;
			var sinceStart = Math.max(lastTime - startTime, 1);
			if (sinceAttempt >= Math.min(sinceStart * 1.2, 100)) {
				debug("RETRY", fn.name, args);
				fn.apply(null, args.concat([startTime]));
			} else fs$1[gracefulQueue].push(elem);
		}
		if (retryTimer === void 0) retryTimer = setTimeout(retry, 0);
	}
}));
//#endregion
//#region node_modules/fs-extra/lib/fs/index.js
var require_fs = /* @__PURE__ */ __commonJSMin(((exports) => {
	var u = require_universalify().fromCallback;
	var fs = require_graceful_fs();
	var api = [
		"access",
		"appendFile",
		"chmod",
		"chown",
		"close",
		"copyFile",
		"fchmod",
		"fchown",
		"fdatasync",
		"fstat",
		"fsync",
		"ftruncate",
		"futimes",
		"lchmod",
		"lchown",
		"link",
		"lstat",
		"mkdir",
		"mkdtemp",
		"open",
		"opendir",
		"readdir",
		"readFile",
		"readlink",
		"realpath",
		"rename",
		"rm",
		"rmdir",
		"stat",
		"symlink",
		"truncate",
		"unlink",
		"utimes",
		"writeFile"
	].filter((key) => {
		return typeof fs[key] === "function";
	});
	Object.assign(exports, fs);
	api.forEach((method) => {
		exports[method] = u(fs[method]);
	});
	exports.exists = function(filename, callback) {
		if (typeof callback === "function") return fs.exists(filename, callback);
		return new Promise((resolve) => {
			return fs.exists(filename, resolve);
		});
	};
	exports.read = function(fd, buffer, offset, length, position, callback) {
		if (typeof callback === "function") return fs.read(fd, buffer, offset, length, position, callback);
		return new Promise((resolve, reject) => {
			fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
				if (err) return reject(err);
				resolve({
					bytesRead,
					buffer
				});
			});
		});
	};
	exports.write = function(fd, buffer, ...args) {
		if (typeof args[args.length - 1] === "function") return fs.write(fd, buffer, ...args);
		return new Promise((resolve, reject) => {
			fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
				if (err) return reject(err);
				resolve({
					bytesWritten,
					buffer
				});
			});
		});
	};
	if (typeof fs.writev === "function") exports.writev = function(fd, buffers, ...args) {
		if (typeof args[args.length - 1] === "function") return fs.writev(fd, buffers, ...args);
		return new Promise((resolve, reject) => {
			fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
				if (err) return reject(err);
				resolve({
					bytesWritten,
					buffers
				});
			});
		});
	};
	if (typeof fs.realpath.native === "function") exports.realpath.native = u(fs.realpath.native);
	else process.emitWarning("fs.realpath.native is not a function. Is fs being monkey-patched?", "Warning", "fs-extra-WARN0003");
}));
//#endregion
//#region node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var path$24 = __require("path");
	module.exports.checkPath = function checkPath(pth) {
		if (process.platform === "win32") {
			if (/[<>:"|?*]/.test(pth.replace(path$24.parse(pth).root, ""))) {
				const error = /* @__PURE__ */ new Error(`Path contains invalid characters: ${pth}`);
				error.code = "EINVAL";
				throw error;
			}
		}
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_fs();
	var { checkPath } = require_utils$1();
	var getMode = (options) => {
		const defaults = { mode: 511 };
		if (typeof options === "number") return options;
		return {
			...defaults,
			...options
		}.mode;
	};
	module.exports.makeDir = async (dir, options) => {
		checkPath(dir);
		return fs.mkdir(dir, {
			mode: getMode(options),
			recursive: true
		});
	};
	module.exports.makeDirSync = (dir, options) => {
		checkPath(dir);
		return fs.mkdirSync(dir, {
			mode: getMode(options),
			recursive: true
		});
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromPromise;
	var { makeDir: _makeDir, makeDirSync } = require_make_dir();
	var makeDir = u(_makeDir);
	module.exports = {
		mkdirs: makeDir,
		mkdirsSync: makeDirSync,
		mkdirp: makeDir,
		mkdirpSync: makeDirSync,
		ensureDir: makeDir,
		ensureDirSync: makeDirSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromPromise;
	var fs = require_fs();
	function pathExists(path) {
		return fs.access(path).then(() => true).catch(() => false);
	}
	module.exports = {
		pathExists: u(pathExists),
		pathExistsSync: fs.existsSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/util/utimes.js
var require_utimes = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	function utimesMillis(path, atime, mtime, callback) {
		fs.open(path, "r+", (err, fd) => {
			if (err) return callback(err);
			fs.futimes(fd, atime, mtime, (futimesErr) => {
				fs.close(fd, (closeErr) => {
					if (callback) callback(futimesErr || closeErr);
				});
			});
		});
	}
	function utimesMillisSync(path, atime, mtime) {
		const fd = fs.openSync(path, "r+");
		fs.futimesSync(fd, atime, mtime);
		return fs.closeSync(fd);
	}
	module.exports = {
		utimesMillis,
		utimesMillisSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/util/stat.js
var require_stat = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_fs();
	var path$23 = __require("path");
	var util$1 = __require("util");
	function getStats(src, dest, opts) {
		const statFunc = opts.dereference ? (file) => fs.stat(file, { bigint: true }) : (file) => fs.lstat(file, { bigint: true });
		return Promise.all([statFunc(src), statFunc(dest).catch((err) => {
			if (err.code === "ENOENT") return null;
			throw err;
		})]).then(([srcStat, destStat]) => ({
			srcStat,
			destStat
		}));
	}
	function getStatsSync(src, dest, opts) {
		let destStat;
		const statFunc = opts.dereference ? (file) => fs.statSync(file, { bigint: true }) : (file) => fs.lstatSync(file, { bigint: true });
		const srcStat = statFunc(src);
		try {
			destStat = statFunc(dest);
		} catch (err) {
			if (err.code === "ENOENT") return {
				srcStat,
				destStat: null
			};
			throw err;
		}
		return {
			srcStat,
			destStat
		};
	}
	function checkPaths(src, dest, funcName, opts, cb) {
		util$1.callbackify(getStats)(src, dest, opts, (err, stats) => {
			if (err) return cb(err);
			const { srcStat, destStat } = stats;
			if (destStat) {
				if (areIdentical(srcStat, destStat)) {
					const srcBaseName = path$23.basename(src);
					const destBaseName = path$23.basename(dest);
					if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) return cb(null, {
						srcStat,
						destStat,
						isChangingCase: true
					});
					return cb(/* @__PURE__ */ new Error("Source and destination must not be the same."));
				}
				if (srcStat.isDirectory() && !destStat.isDirectory()) return cb(/* @__PURE__ */ new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`));
				if (!srcStat.isDirectory() && destStat.isDirectory()) return cb(/* @__PURE__ */ new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`));
			}
			if (srcStat.isDirectory() && isSrcSubdir(src, dest)) return cb(new Error(errMsg(src, dest, funcName)));
			return cb(null, {
				srcStat,
				destStat
			});
		});
	}
	function checkPathsSync(src, dest, funcName, opts) {
		const { srcStat, destStat } = getStatsSync(src, dest, opts);
		if (destStat) {
			if (areIdentical(srcStat, destStat)) {
				const srcBaseName = path$23.basename(src);
				const destBaseName = path$23.basename(dest);
				if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) return {
					srcStat,
					destStat,
					isChangingCase: true
				};
				throw new Error("Source and destination must not be the same.");
			}
			if (srcStat.isDirectory() && !destStat.isDirectory()) throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
			if (!srcStat.isDirectory() && destStat.isDirectory()) throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
		}
		if (srcStat.isDirectory() && isSrcSubdir(src, dest)) throw new Error(errMsg(src, dest, funcName));
		return {
			srcStat,
			destStat
		};
	}
	function checkParentPaths(src, srcStat, dest, funcName, cb) {
		const srcParent = path$23.resolve(path$23.dirname(src));
		const destParent = path$23.resolve(path$23.dirname(dest));
		if (destParent === srcParent || destParent === path$23.parse(destParent).root) return cb();
		fs.stat(destParent, { bigint: true }, (err, destStat) => {
			if (err) {
				if (err.code === "ENOENT") return cb();
				return cb(err);
			}
			if (areIdentical(srcStat, destStat)) return cb(new Error(errMsg(src, dest, funcName)));
			return checkParentPaths(src, srcStat, destParent, funcName, cb);
		});
	}
	function checkParentPathsSync(src, srcStat, dest, funcName) {
		const srcParent = path$23.resolve(path$23.dirname(src));
		const destParent = path$23.resolve(path$23.dirname(dest));
		if (destParent === srcParent || destParent === path$23.parse(destParent).root) return;
		let destStat;
		try {
			destStat = fs.statSync(destParent, { bigint: true });
		} catch (err) {
			if (err.code === "ENOENT") return;
			throw err;
		}
		if (areIdentical(srcStat, destStat)) throw new Error(errMsg(src, dest, funcName));
		return checkParentPathsSync(src, srcStat, destParent, funcName);
	}
	function areIdentical(srcStat, destStat) {
		return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
	}
	function isSrcSubdir(src, dest) {
		const srcArr = path$23.resolve(src).split(path$23.sep).filter((i) => i);
		const destArr = path$23.resolve(dest).split(path$23.sep).filter((i) => i);
		return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true);
	}
	function errMsg(src, dest, funcName) {
		return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
	}
	module.exports = {
		checkPaths,
		checkPathsSync,
		checkParentPaths,
		checkParentPathsSync,
		isSrcSubdir,
		areIdentical
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/copy/copy.js
var require_copy$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	var path$22 = __require("path");
	var mkdirs = require_mkdirs().mkdirs;
	var pathExists = require_path_exists().pathExists;
	var utimesMillis = require_utimes().utimesMillis;
	var stat = require_stat();
	function copy(src, dest, opts, cb) {
		if (typeof opts === "function" && !cb) {
			cb = opts;
			opts = {};
		} else if (typeof opts === "function") opts = { filter: opts };
		cb = cb || function() {};
		opts = opts || {};
		opts.clobber = "clobber" in opts ? !!opts.clobber : true;
		opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
		if (opts.preserveTimestamps && process.arch === "ia32") process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0001");
		stat.checkPaths(src, dest, "copy", opts, (err, stats) => {
			if (err) return cb(err);
			const { srcStat, destStat } = stats;
			stat.checkParentPaths(src, srcStat, dest, "copy", (err) => {
				if (err) return cb(err);
				if (opts.filter) return handleFilter(checkParentDir, destStat, src, dest, opts, cb);
				return checkParentDir(destStat, src, dest, opts, cb);
			});
		});
	}
	function checkParentDir(destStat, src, dest, opts, cb) {
		const destParent = path$22.dirname(dest);
		pathExists(destParent, (err, dirExists) => {
			if (err) return cb(err);
			if (dirExists) return getStats(destStat, src, dest, opts, cb);
			mkdirs(destParent, (err) => {
				if (err) return cb(err);
				return getStats(destStat, src, dest, opts, cb);
			});
		});
	}
	function handleFilter(onInclude, destStat, src, dest, opts, cb) {
		Promise.resolve(opts.filter(src, dest)).then((include) => {
			if (include) return onInclude(destStat, src, dest, opts, cb);
			return cb();
		}, (error) => cb(error));
	}
	function startCopy(destStat, src, dest, opts, cb) {
		if (opts.filter) return handleFilter(getStats, destStat, src, dest, opts, cb);
		return getStats(destStat, src, dest, opts, cb);
	}
	function getStats(destStat, src, dest, opts, cb) {
		(opts.dereference ? fs.stat : fs.lstat)(src, (err, srcStat) => {
			if (err) return cb(err);
			if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts, cb);
			else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts, cb);
			else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts, cb);
			else if (srcStat.isSocket()) return cb(/* @__PURE__ */ new Error(`Cannot copy a socket file: ${src}`));
			else if (srcStat.isFIFO()) return cb(/* @__PURE__ */ new Error(`Cannot copy a FIFO pipe: ${src}`));
			return cb(/* @__PURE__ */ new Error(`Unknown file: ${src}`));
		});
	}
	function onFile(srcStat, destStat, src, dest, opts, cb) {
		if (!destStat) return copyFile(srcStat, src, dest, opts, cb);
		return mayCopyFile(srcStat, src, dest, opts, cb);
	}
	function mayCopyFile(srcStat, src, dest, opts, cb) {
		if (opts.overwrite) fs.unlink(dest, (err) => {
			if (err) return cb(err);
			return copyFile(srcStat, src, dest, opts, cb);
		});
		else if (opts.errorOnExist) return cb(/* @__PURE__ */ new Error(`'${dest}' already exists`));
		else return cb();
	}
	function copyFile(srcStat, src, dest, opts, cb) {
		fs.copyFile(src, dest, (err) => {
			if (err) return cb(err);
			if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src, dest, cb);
			return setDestMode(dest, srcStat.mode, cb);
		});
	}
	function handleTimestampsAndMode(srcMode, src, dest, cb) {
		if (fileIsNotWritable(srcMode)) return makeFileWritable(dest, srcMode, (err) => {
			if (err) return cb(err);
			return setDestTimestampsAndMode(srcMode, src, dest, cb);
		});
		return setDestTimestampsAndMode(srcMode, src, dest, cb);
	}
	function fileIsNotWritable(srcMode) {
		return (srcMode & 128) === 0;
	}
	function makeFileWritable(dest, srcMode, cb) {
		return setDestMode(dest, srcMode | 128, cb);
	}
	function setDestTimestampsAndMode(srcMode, src, dest, cb) {
		setDestTimestamps(src, dest, (err) => {
			if (err) return cb(err);
			return setDestMode(dest, srcMode, cb);
		});
	}
	function setDestMode(dest, srcMode, cb) {
		return fs.chmod(dest, srcMode, cb);
	}
	function setDestTimestamps(src, dest, cb) {
		fs.stat(src, (err, updatedSrcStat) => {
			if (err) return cb(err);
			return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb);
		});
	}
	function onDir(srcStat, destStat, src, dest, opts, cb) {
		if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts, cb);
		return copyDir(src, dest, opts, cb);
	}
	function mkDirAndCopy(srcMode, src, dest, opts, cb) {
		fs.mkdir(dest, (err) => {
			if (err) return cb(err);
			copyDir(src, dest, opts, (err) => {
				if (err) return cb(err);
				return setDestMode(dest, srcMode, cb);
			});
		});
	}
	function copyDir(src, dest, opts, cb) {
		fs.readdir(src, (err, items) => {
			if (err) return cb(err);
			return copyDirItems(items, src, dest, opts, cb);
		});
	}
	function copyDirItems(items, src, dest, opts, cb) {
		const item = items.pop();
		if (!item) return cb();
		return copyDirItem(items, item, src, dest, opts, cb);
	}
	function copyDirItem(items, item, src, dest, opts, cb) {
		const srcItem = path$22.join(src, item);
		const destItem = path$22.join(dest, item);
		stat.checkPaths(srcItem, destItem, "copy", opts, (err, stats) => {
			if (err) return cb(err);
			const { destStat } = stats;
			startCopy(destStat, srcItem, destItem, opts, (err) => {
				if (err) return cb(err);
				return copyDirItems(items, src, dest, opts, cb);
			});
		});
	}
	function onLink(destStat, src, dest, opts, cb) {
		fs.readlink(src, (err, resolvedSrc) => {
			if (err) return cb(err);
			if (opts.dereference) resolvedSrc = path$22.resolve(process.cwd(), resolvedSrc);
			if (!destStat) return fs.symlink(resolvedSrc, dest, cb);
			else fs.readlink(dest, (err, resolvedDest) => {
				if (err) {
					if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs.symlink(resolvedSrc, dest, cb);
					return cb(err);
				}
				if (opts.dereference) resolvedDest = path$22.resolve(process.cwd(), resolvedDest);
				if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) return cb(/* @__PURE__ */ new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`));
				if (destStat.isDirectory() && stat.isSrcSubdir(resolvedDest, resolvedSrc)) return cb(/* @__PURE__ */ new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`));
				return copyLink(resolvedSrc, dest, cb);
			});
		});
	}
	function copyLink(resolvedSrc, dest, cb) {
		fs.unlink(dest, (err) => {
			if (err) return cb(err);
			return fs.symlink(resolvedSrc, dest, cb);
		});
	}
	module.exports = copy;
}));
//#endregion
//#region node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	var path$21 = __require("path");
	var mkdirsSync = require_mkdirs().mkdirsSync;
	var utimesMillisSync = require_utimes().utimesMillisSync;
	var stat = require_stat();
	function copySync(src, dest, opts) {
		if (typeof opts === "function") opts = { filter: opts };
		opts = opts || {};
		opts.clobber = "clobber" in opts ? !!opts.clobber : true;
		opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
		if (opts.preserveTimestamps && process.arch === "ia32") process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0002");
		const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
		stat.checkParentPathsSync(src, srcStat, dest, "copy");
		return handleFilterAndCopy(destStat, src, dest, opts);
	}
	function handleFilterAndCopy(destStat, src, dest, opts) {
		if (opts.filter && !opts.filter(src, dest)) return;
		const destParent = path$21.dirname(dest);
		if (!fs.existsSync(destParent)) mkdirsSync(destParent);
		return getStats(destStat, src, dest, opts);
	}
	function startCopy(destStat, src, dest, opts) {
		if (opts.filter && !opts.filter(src, dest)) return;
		return getStats(destStat, src, dest, opts);
	}
	function getStats(destStat, src, dest, opts) {
		const srcStat = (opts.dereference ? fs.statSync : fs.lstatSync)(src);
		if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
		else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
		else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
		else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
		else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
		throw new Error(`Unknown file: ${src}`);
	}
	function onFile(srcStat, destStat, src, dest, opts) {
		if (!destStat) return copyFile(srcStat, src, dest, opts);
		return mayCopyFile(srcStat, src, dest, opts);
	}
	function mayCopyFile(srcStat, src, dest, opts) {
		if (opts.overwrite) {
			fs.unlinkSync(dest);
			return copyFile(srcStat, src, dest, opts);
		} else if (opts.errorOnExist) throw new Error(`'${dest}' already exists`);
	}
	function copyFile(srcStat, src, dest, opts) {
		fs.copyFileSync(src, dest);
		if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
		return setDestMode(dest, srcStat.mode);
	}
	function handleTimestamps(srcMode, src, dest) {
		if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
		return setDestTimestamps(src, dest);
	}
	function fileIsNotWritable(srcMode) {
		return (srcMode & 128) === 0;
	}
	function makeFileWritable(dest, srcMode) {
		return setDestMode(dest, srcMode | 128);
	}
	function setDestMode(dest, srcMode) {
		return fs.chmodSync(dest, srcMode);
	}
	function setDestTimestamps(src, dest) {
		const updatedSrcStat = fs.statSync(src);
		return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
	}
	function onDir(srcStat, destStat, src, dest, opts) {
		if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
		return copyDir(src, dest, opts);
	}
	function mkDirAndCopy(srcMode, src, dest, opts) {
		fs.mkdirSync(dest);
		copyDir(src, dest, opts);
		return setDestMode(dest, srcMode);
	}
	function copyDir(src, dest, opts) {
		fs.readdirSync(src).forEach((item) => copyDirItem(item, src, dest, opts));
	}
	function copyDirItem(item, src, dest, opts) {
		const srcItem = path$21.join(src, item);
		const destItem = path$21.join(dest, item);
		const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
		return startCopy(destStat, srcItem, destItem, opts);
	}
	function onLink(destStat, src, dest, opts) {
		let resolvedSrc = fs.readlinkSync(src);
		if (opts.dereference) resolvedSrc = path$21.resolve(process.cwd(), resolvedSrc);
		if (!destStat) return fs.symlinkSync(resolvedSrc, dest);
		else {
			let resolvedDest;
			try {
				resolvedDest = fs.readlinkSync(dest);
			} catch (err) {
				if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs.symlinkSync(resolvedSrc, dest);
				throw err;
			}
			if (opts.dereference) resolvedDest = path$21.resolve(process.cwd(), resolvedDest);
			if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
			if (fs.statSync(dest).isDirectory() && stat.isSrcSubdir(resolvedDest, resolvedSrc)) throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
			return copyLink(resolvedSrc, dest);
		}
	}
	function copyLink(resolvedSrc, dest) {
		fs.unlinkSync(dest);
		return fs.symlinkSync(resolvedSrc, dest);
	}
	module.exports = copySync;
}));
//#endregion
//#region node_modules/fs-extra/lib/copy/index.js
var require_copy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromCallback;
	module.exports = {
		copy: u(require_copy$1()),
		copySync: require_copy_sync()
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/remove/rimraf.js
var require_rimraf = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	var path$20 = __require("path");
	var assert = __require("assert");
	var isWindows = process.platform === "win32";
	function defaults(options) {
		[
			"unlink",
			"chmod",
			"stat",
			"lstat",
			"rmdir",
			"readdir"
		].forEach((m) => {
			options[m] = options[m] || fs[m];
			m = m + "Sync";
			options[m] = options[m] || fs[m];
		});
		options.maxBusyTries = options.maxBusyTries || 3;
	}
	function rimraf(p, options, cb) {
		let busyTries = 0;
		if (typeof options === "function") {
			cb = options;
			options = {};
		}
		assert(p, "rimraf: missing path");
		assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
		assert.strictEqual(typeof cb, "function", "rimraf: callback function required");
		assert(options, "rimraf: invalid options argument provided");
		assert.strictEqual(typeof options, "object", "rimraf: options should be object");
		defaults(options);
		rimraf_(p, options, function CB(er) {
			if (er) {
				if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") && busyTries < options.maxBusyTries) {
					busyTries++;
					const time = busyTries * 100;
					return setTimeout(() => rimraf_(p, options, CB), time);
				}
				if (er.code === "ENOENT") er = null;
			}
			cb(er);
		});
	}
	function rimraf_(p, options, cb) {
		assert(p);
		assert(options);
		assert(typeof cb === "function");
		options.lstat(p, (er, st) => {
			if (er && er.code === "ENOENT") return cb(null);
			if (er && er.code === "EPERM" && isWindows) return fixWinEPERM(p, options, er, cb);
			if (st && st.isDirectory()) return rmdir(p, options, er, cb);
			options.unlink(p, (er) => {
				if (er) {
					if (er.code === "ENOENT") return cb(null);
					if (er.code === "EPERM") return isWindows ? fixWinEPERM(p, options, er, cb) : rmdir(p, options, er, cb);
					if (er.code === "EISDIR") return rmdir(p, options, er, cb);
				}
				return cb(er);
			});
		});
	}
	function fixWinEPERM(p, options, er, cb) {
		assert(p);
		assert(options);
		assert(typeof cb === "function");
		options.chmod(p, 438, (er2) => {
			if (er2) cb(er2.code === "ENOENT" ? null : er);
			else options.stat(p, (er3, stats) => {
				if (er3) cb(er3.code === "ENOENT" ? null : er);
				else if (stats.isDirectory()) rmdir(p, options, er, cb);
				else options.unlink(p, cb);
			});
		});
	}
	function fixWinEPERMSync(p, options, er) {
		let stats;
		assert(p);
		assert(options);
		try {
			options.chmodSync(p, 438);
		} catch (er2) {
			if (er2.code === "ENOENT") return;
			else throw er;
		}
		try {
			stats = options.statSync(p);
		} catch (er3) {
			if (er3.code === "ENOENT") return;
			else throw er;
		}
		if (stats.isDirectory()) rmdirSync(p, options, er);
		else options.unlinkSync(p);
	}
	function rmdir(p, options, originalEr, cb) {
		assert(p);
		assert(options);
		assert(typeof cb === "function");
		options.rmdir(p, (er) => {
			if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")) rmkids(p, options, cb);
			else if (er && er.code === "ENOTDIR") cb(originalEr);
			else cb(er);
		});
	}
	function rmkids(p, options, cb) {
		assert(p);
		assert(options);
		assert(typeof cb === "function");
		options.readdir(p, (er, files) => {
			if (er) return cb(er);
			let n = files.length;
			let errState;
			if (n === 0) return options.rmdir(p, cb);
			files.forEach((f) => {
				rimraf(path$20.join(p, f), options, (er) => {
					if (errState) return;
					if (er) return cb(errState = er);
					if (--n === 0) options.rmdir(p, cb);
				});
			});
		});
	}
	function rimrafSync(p, options) {
		let st;
		options = options || {};
		defaults(options);
		assert(p, "rimraf: missing path");
		assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
		assert(options, "rimraf: missing options");
		assert.strictEqual(typeof options, "object", "rimraf: options should be object");
		try {
			st = options.lstatSync(p);
		} catch (er) {
			if (er.code === "ENOENT") return;
			if (er.code === "EPERM" && isWindows) fixWinEPERMSync(p, options, er);
		}
		try {
			if (st && st.isDirectory()) rmdirSync(p, options, null);
			else options.unlinkSync(p);
		} catch (er) {
			if (er.code === "ENOENT") return;
			else if (er.code === "EPERM") return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
			else if (er.code !== "EISDIR") throw er;
			rmdirSync(p, options, er);
		}
	}
	function rmdirSync(p, options, originalEr) {
		assert(p);
		assert(options);
		try {
			options.rmdirSync(p);
		} catch (er) {
			if (er.code === "ENOTDIR") throw originalEr;
			else if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM") rmkidsSync(p, options);
			else if (er.code !== "ENOENT") throw er;
		}
	}
	function rmkidsSync(p, options) {
		assert(p);
		assert(options);
		options.readdirSync(p).forEach((f) => rimrafSync(path$20.join(p, f), options));
		if (isWindows) {
			const startTime = Date.now();
			do
				try {
					return options.rmdirSync(p, options);
				} catch {}
			while (Date.now() - startTime < 500);
		} else return options.rmdirSync(p, options);
	}
	module.exports = rimraf;
	rimraf.sync = rimrafSync;
}));
//#endregion
//#region node_modules/fs-extra/lib/remove/index.js
var require_remove = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	var u = require_universalify().fromCallback;
	var rimraf = require_rimraf();
	function remove(path, callback) {
		if (fs.rm) return fs.rm(path, {
			recursive: true,
			force: true
		}, callback);
		rimraf(path, callback);
	}
	function removeSync(path) {
		if (fs.rmSync) return fs.rmSync(path, {
			recursive: true,
			force: true
		});
		rimraf.sync(path);
	}
	module.exports = {
		remove: u(remove),
		removeSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/empty/index.js
var require_empty = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromPromise;
	var fs = require_fs();
	var path$19 = __require("path");
	var mkdir = require_mkdirs();
	var remove = require_remove();
	var emptyDir = u(async function emptyDir(dir) {
		let items;
		try {
			items = await fs.readdir(dir);
		} catch {
			return mkdir.mkdirs(dir);
		}
		return Promise.all(items.map((item) => remove.remove(path$19.join(dir, item))));
	});
	function emptyDirSync(dir) {
		let items;
		try {
			items = fs.readdirSync(dir);
		} catch {
			return mkdir.mkdirsSync(dir);
		}
		items.forEach((item) => {
			item = path$19.join(dir, item);
			remove.removeSync(item);
		});
	}
	module.exports = {
		emptyDirSync,
		emptydirSync: emptyDirSync,
		emptyDir,
		emptydir: emptyDir
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/ensure/file.js
var require_file = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromCallback;
	var path$18 = __require("path");
	var fs = require_graceful_fs();
	var mkdir = require_mkdirs();
	function createFile(file, callback) {
		function makeFile() {
			fs.writeFile(file, "", (err) => {
				if (err) return callback(err);
				callback();
			});
		}
		fs.stat(file, (err, stats) => {
			if (!err && stats.isFile()) return callback();
			const dir = path$18.dirname(file);
			fs.stat(dir, (err, stats) => {
				if (err) {
					if (err.code === "ENOENT") return mkdir.mkdirs(dir, (err) => {
						if (err) return callback(err);
						makeFile();
					});
					return callback(err);
				}
				if (stats.isDirectory()) makeFile();
				else fs.readdir(dir, (err) => {
					if (err) return callback(err);
				});
			});
		});
	}
	function createFileSync(file) {
		let stats;
		try {
			stats = fs.statSync(file);
		} catch {}
		if (stats && stats.isFile()) return;
		const dir = path$18.dirname(file);
		try {
			if (!fs.statSync(dir).isDirectory()) fs.readdirSync(dir);
		} catch (err) {
			if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
			else throw err;
		}
		fs.writeFileSync(file, "");
	}
	module.exports = {
		createFile: u(createFile),
		createFileSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/ensure/link.js
var require_link = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromCallback;
	var path$17 = __require("path");
	var fs = require_graceful_fs();
	var mkdir = require_mkdirs();
	var pathExists = require_path_exists().pathExists;
	var { areIdentical } = require_stat();
	function createLink(srcpath, dstpath, callback) {
		function makeLink(srcpath, dstpath) {
			fs.link(srcpath, dstpath, (err) => {
				if (err) return callback(err);
				callback(null);
			});
		}
		fs.lstat(dstpath, (_, dstStat) => {
			fs.lstat(srcpath, (err, srcStat) => {
				if (err) {
					err.message = err.message.replace("lstat", "ensureLink");
					return callback(err);
				}
				if (dstStat && areIdentical(srcStat, dstStat)) return callback(null);
				const dir = path$17.dirname(dstpath);
				pathExists(dir, (err, dirExists) => {
					if (err) return callback(err);
					if (dirExists) return makeLink(srcpath, dstpath);
					mkdir.mkdirs(dir, (err) => {
						if (err) return callback(err);
						makeLink(srcpath, dstpath);
					});
				});
			});
		});
	}
	function createLinkSync(srcpath, dstpath) {
		let dstStat;
		try {
			dstStat = fs.lstatSync(dstpath);
		} catch {}
		try {
			const srcStat = fs.lstatSync(srcpath);
			if (dstStat && areIdentical(srcStat, dstStat)) return;
		} catch (err) {
			err.message = err.message.replace("lstat", "ensureLink");
			throw err;
		}
		const dir = path$17.dirname(dstpath);
		if (fs.existsSync(dir)) return fs.linkSync(srcpath, dstpath);
		mkdir.mkdirsSync(dir);
		return fs.linkSync(srcpath, dstpath);
	}
	module.exports = {
		createLink: u(createLink),
		createLinkSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var path$16 = __require("path");
	var fs = require_graceful_fs();
	var pathExists = require_path_exists().pathExists;
	/**
	* Function that returns two types of paths, one relative to symlink, and one
	* relative to the current working directory. Checks if path is absolute or
	* relative. If the path is relative, this function checks if the path is
	* relative to symlink or relative to current working directory. This is an
	* initiative to find a smarter `srcpath` to supply when building symlinks.
	* This allows you to determine which path to use out of one of three possible
	* types of source paths. The first is an absolute path. This is detected by
	* `path.isAbsolute()`. When an absolute path is provided, it is checked to
	* see if it exists. If it does it's used, if not an error is returned
	* (callback)/ thrown (sync). The other two options for `srcpath` are a
	* relative url. By default Node's `fs.symlink` works by creating a symlink
	* using `dstpath` and expects the `srcpath` to be relative to the newly
	* created symlink. If you provide a `srcpath` that does not exist on the file
	* system it results in a broken symlink. To minimize this, the function
	* checks to see if the 'relative to symlink' source file exists, and if it
	* does it will use it. If it does not, it checks if there's a file that
	* exists that is relative to the current working directory, if does its used.
	* This preserves the expectations of the original fs.symlink spec and adds
	* the ability to pass in `relative to current working direcotry` paths.
	*/
	function symlinkPaths(srcpath, dstpath, callback) {
		if (path$16.isAbsolute(srcpath)) return fs.lstat(srcpath, (err) => {
			if (err) {
				err.message = err.message.replace("lstat", "ensureSymlink");
				return callback(err);
			}
			return callback(null, {
				toCwd: srcpath,
				toDst: srcpath
			});
		});
		else {
			const dstdir = path$16.dirname(dstpath);
			const relativeToDst = path$16.join(dstdir, srcpath);
			return pathExists(relativeToDst, (err, exists) => {
				if (err) return callback(err);
				if (exists) return callback(null, {
					toCwd: relativeToDst,
					toDst: srcpath
				});
				else return fs.lstat(srcpath, (err) => {
					if (err) {
						err.message = err.message.replace("lstat", "ensureSymlink");
						return callback(err);
					}
					return callback(null, {
						toCwd: srcpath,
						toDst: path$16.relative(dstdir, srcpath)
					});
				});
			});
		}
	}
	function symlinkPathsSync(srcpath, dstpath) {
		let exists;
		if (path$16.isAbsolute(srcpath)) {
			exists = fs.existsSync(srcpath);
			if (!exists) throw new Error("absolute srcpath does not exist");
			return {
				toCwd: srcpath,
				toDst: srcpath
			};
		} else {
			const dstdir = path$16.dirname(dstpath);
			const relativeToDst = path$16.join(dstdir, srcpath);
			exists = fs.existsSync(relativeToDst);
			if (exists) return {
				toCwd: relativeToDst,
				toDst: srcpath
			};
			else {
				exists = fs.existsSync(srcpath);
				if (!exists) throw new Error("relative srcpath does not exist");
				return {
					toCwd: srcpath,
					toDst: path$16.relative(dstdir, srcpath)
				};
			}
		}
	}
	module.exports = {
		symlinkPaths,
		symlinkPathsSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	function symlinkType(srcpath, type, callback) {
		callback = typeof type === "function" ? type : callback;
		type = typeof type === "function" ? false : type;
		if (type) return callback(null, type);
		fs.lstat(srcpath, (err, stats) => {
			if (err) return callback(null, "file");
			type = stats && stats.isDirectory() ? "dir" : "file";
			callback(null, type);
		});
	}
	function symlinkTypeSync(srcpath, type) {
		let stats;
		if (type) return type;
		try {
			stats = fs.lstatSync(srcpath);
		} catch {
			return "file";
		}
		return stats && stats.isDirectory() ? "dir" : "file";
	}
	module.exports = {
		symlinkType,
		symlinkTypeSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromCallback;
	var path$15 = __require("path");
	var fs = require_fs();
	var _mkdirs = require_mkdirs();
	var mkdirs = _mkdirs.mkdirs;
	var mkdirsSync = _mkdirs.mkdirsSync;
	var _symlinkPaths = require_symlink_paths();
	var symlinkPaths = _symlinkPaths.symlinkPaths;
	var symlinkPathsSync = _symlinkPaths.symlinkPathsSync;
	var _symlinkType = require_symlink_type();
	var symlinkType = _symlinkType.symlinkType;
	var symlinkTypeSync = _symlinkType.symlinkTypeSync;
	var pathExists = require_path_exists().pathExists;
	var { areIdentical } = require_stat();
	function createSymlink(srcpath, dstpath, type, callback) {
		callback = typeof type === "function" ? type : callback;
		type = typeof type === "function" ? false : type;
		fs.lstat(dstpath, (err, stats) => {
			if (!err && stats.isSymbolicLink()) Promise.all([fs.stat(srcpath), fs.stat(dstpath)]).then(([srcStat, dstStat]) => {
				if (areIdentical(srcStat, dstStat)) return callback(null);
				_createSymlink(srcpath, dstpath, type, callback);
			});
			else _createSymlink(srcpath, dstpath, type, callback);
		});
	}
	function _createSymlink(srcpath, dstpath, type, callback) {
		symlinkPaths(srcpath, dstpath, (err, relative) => {
			if (err) return callback(err);
			srcpath = relative.toDst;
			symlinkType(relative.toCwd, type, (err, type) => {
				if (err) return callback(err);
				const dir = path$15.dirname(dstpath);
				pathExists(dir, (err, dirExists) => {
					if (err) return callback(err);
					if (dirExists) return fs.symlink(srcpath, dstpath, type, callback);
					mkdirs(dir, (err) => {
						if (err) return callback(err);
						fs.symlink(srcpath, dstpath, type, callback);
					});
				});
			});
		});
	}
	function createSymlinkSync(srcpath, dstpath, type) {
		let stats;
		try {
			stats = fs.lstatSync(dstpath);
		} catch {}
		if (stats && stats.isSymbolicLink()) {
			if (areIdentical(fs.statSync(srcpath), fs.statSync(dstpath))) return;
		}
		const relative = symlinkPathsSync(srcpath, dstpath);
		srcpath = relative.toDst;
		type = symlinkTypeSync(relative.toCwd, type);
		const dir = path$15.dirname(dstpath);
		if (fs.existsSync(dir)) return fs.symlinkSync(srcpath, dstpath, type);
		mkdirsSync(dir);
		return fs.symlinkSync(srcpath, dstpath, type);
	}
	module.exports = {
		createSymlink: u(createSymlink),
		createSymlinkSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/ensure/index.js
var require_ensure = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { createFile, createFileSync } = require_file();
	var { createLink, createLinkSync } = require_link();
	var { createSymlink, createSymlinkSync } = require_symlink();
	module.exports = {
		createFile,
		createFileSync,
		ensureFile: createFile,
		ensureFileSync: createFileSync,
		createLink,
		createLinkSync,
		ensureLink: createLink,
		ensureLinkSync: createLinkSync,
		createSymlink,
		createSymlinkSync,
		ensureSymlink: createSymlink,
		ensureSymlinkSync: createSymlinkSync
	};
}));
//#endregion
//#region node_modules/jsonfile/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
		const EOF = finalEOL ? EOL : "";
		const str = JSON.stringify(obj, replacer, spaces);
		if (str === void 0) throw new TypeError(`Converting ${typeof obj} value to JSON is not supported`);
		return str.replace(/\n/g, EOL) + EOF;
	}
	function stripBom(content) {
		if (Buffer.isBuffer(content)) content = content.toString("utf8");
		return content.replace(/^\uFEFF/, "");
	}
	module.exports = {
		stringify,
		stripBom
	};
}));
//#endregion
//#region node_modules/jsonfile/index.js
var require_jsonfile$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _fs;
	try {
		_fs = require_graceful_fs();
	} catch (_) {
		_fs = __require("fs");
	}
	var universalify = require_universalify();
	var { stringify, stripBom } = require_utils();
	async function _readFile(file, options = {}) {
		if (typeof options === "string") options = { encoding: options };
		const fs = options.fs || _fs;
		const shouldThrow = "throws" in options ? options.throws : true;
		let data = await universalify.fromCallback(fs.readFile)(file, options);
		data = stripBom(data);
		let obj;
		try {
			obj = JSON.parse(data, options ? options.reviver : null);
		} catch (err) {
			if (shouldThrow) {
				err.message = `${file}: ${err.message}`;
				throw err;
			} else return null;
		}
		return obj;
	}
	var readFile = universalify.fromPromise(_readFile);
	function readFileSync(file, options = {}) {
		if (typeof options === "string") options = { encoding: options };
		const fs = options.fs || _fs;
		const shouldThrow = "throws" in options ? options.throws : true;
		try {
			let content = fs.readFileSync(file, options);
			content = stripBom(content);
			return JSON.parse(content, options.reviver);
		} catch (err) {
			if (shouldThrow) {
				err.message = `${file}: ${err.message}`;
				throw err;
			} else return null;
		}
	}
	async function _writeFile(file, obj, options = {}) {
		const fs = options.fs || _fs;
		const str = stringify(obj, options);
		await universalify.fromCallback(fs.writeFile)(file, str, options);
	}
	var writeFile = universalify.fromPromise(_writeFile);
	function writeFileSync(file, obj, options = {}) {
		const fs = options.fs || _fs;
		const str = stringify(obj, options);
		return fs.writeFileSync(file, str, options);
	}
	module.exports = {
		readFile,
		readFileSync,
		writeFile,
		writeFileSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var jsonFile = require_jsonfile$1();
	module.exports = {
		readJson: jsonFile.readFile,
		readJsonSync: jsonFile.readFileSync,
		writeJson: jsonFile.writeFile,
		writeJsonSync: jsonFile.writeFileSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/output-file/index.js
var require_output_file = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromCallback;
	var fs = require_graceful_fs();
	var path$14 = __require("path");
	var mkdir = require_mkdirs();
	var pathExists = require_path_exists().pathExists;
	function outputFile(file, data, encoding, callback) {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = "utf8";
		}
		const dir = path$14.dirname(file);
		pathExists(dir, (err, itDoes) => {
			if (err) return callback(err);
			if (itDoes) return fs.writeFile(file, data, encoding, callback);
			mkdir.mkdirs(dir, (err) => {
				if (err) return callback(err);
				fs.writeFile(file, data, encoding, callback);
			});
		});
	}
	function outputFileSync(file, ...args) {
		const dir = path$14.dirname(file);
		if (fs.existsSync(dir)) return fs.writeFileSync(file, ...args);
		mkdir.mkdirsSync(dir);
		fs.writeFileSync(file, ...args);
	}
	module.exports = {
		outputFile: u(outputFile),
		outputFileSync
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/json/output-json.js
var require_output_json = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { stringify } = require_utils();
	var { outputFile } = require_output_file();
	async function outputJson(file, data, options = {}) {
		await outputFile(file, stringify(data, options), options);
	}
	module.exports = outputJson;
}));
//#endregion
//#region node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { stringify } = require_utils();
	var { outputFileSync } = require_output_file();
	function outputJsonSync(file, data, options) {
		outputFileSync(file, stringify(data, options), options);
	}
	module.exports = outputJsonSync;
}));
//#endregion
//#region node_modules/fs-extra/lib/json/index.js
var require_json$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromPromise;
	var jsonFile = require_jsonfile();
	jsonFile.outputJson = u(require_output_json());
	jsonFile.outputJsonSync = require_output_json_sync();
	jsonFile.outputJSON = jsonFile.outputJson;
	jsonFile.outputJSONSync = jsonFile.outputJsonSync;
	jsonFile.writeJSON = jsonFile.writeJson;
	jsonFile.writeJSONSync = jsonFile.writeJsonSync;
	jsonFile.readJSON = jsonFile.readJson;
	jsonFile.readJSONSync = jsonFile.readJsonSync;
	module.exports = jsonFile;
}));
//#endregion
//#region node_modules/fs-extra/lib/move/move.js
var require_move$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	var path$13 = __require("path");
	var copy = require_copy().copy;
	var remove = require_remove().remove;
	var mkdirp = require_mkdirs().mkdirp;
	var pathExists = require_path_exists().pathExists;
	var stat = require_stat();
	function move(src, dest, opts, cb) {
		if (typeof opts === "function") {
			cb = opts;
			opts = {};
		}
		opts = opts || {};
		const overwrite = opts.overwrite || opts.clobber || false;
		stat.checkPaths(src, dest, "move", opts, (err, stats) => {
			if (err) return cb(err);
			const { srcStat, isChangingCase = false } = stats;
			stat.checkParentPaths(src, srcStat, dest, "move", (err) => {
				if (err) return cb(err);
				if (isParentRoot(dest)) return doRename(src, dest, overwrite, isChangingCase, cb);
				mkdirp(path$13.dirname(dest), (err) => {
					if (err) return cb(err);
					return doRename(src, dest, overwrite, isChangingCase, cb);
				});
			});
		});
	}
	function isParentRoot(dest) {
		const parent = path$13.dirname(dest);
		return path$13.parse(parent).root === parent;
	}
	function doRename(src, dest, overwrite, isChangingCase, cb) {
		if (isChangingCase) return rename(src, dest, overwrite, cb);
		if (overwrite) return remove(dest, (err) => {
			if (err) return cb(err);
			return rename(src, dest, overwrite, cb);
		});
		pathExists(dest, (err, destExists) => {
			if (err) return cb(err);
			if (destExists) return cb(/* @__PURE__ */ new Error("dest already exists."));
			return rename(src, dest, overwrite, cb);
		});
	}
	function rename(src, dest, overwrite, cb) {
		fs.rename(src, dest, (err) => {
			if (!err) return cb();
			if (err.code !== "EXDEV") return cb(err);
			return moveAcrossDevice(src, dest, overwrite, cb);
		});
	}
	function moveAcrossDevice(src, dest, overwrite, cb) {
		copy(src, dest, {
			overwrite,
			errorOnExist: true
		}, (err) => {
			if (err) return cb(err);
			return remove(src, cb);
		});
	}
	module.exports = move;
}));
//#endregion
//#region node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require_graceful_fs();
	var path$12 = __require("path");
	var copySync = require_copy().copySync;
	var removeSync = require_remove().removeSync;
	var mkdirpSync = require_mkdirs().mkdirpSync;
	var stat = require_stat();
	function moveSync(src, dest, opts) {
		opts = opts || {};
		const overwrite = opts.overwrite || opts.clobber || false;
		const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
		stat.checkParentPathsSync(src, srcStat, dest, "move");
		if (!isParentRoot(dest)) mkdirpSync(path$12.dirname(dest));
		return doRename(src, dest, overwrite, isChangingCase);
	}
	function isParentRoot(dest) {
		const parent = path$12.dirname(dest);
		return path$12.parse(parent).root === parent;
	}
	function doRename(src, dest, overwrite, isChangingCase) {
		if (isChangingCase) return rename(src, dest, overwrite);
		if (overwrite) {
			removeSync(dest);
			return rename(src, dest, overwrite);
		}
		if (fs.existsSync(dest)) throw new Error("dest already exists.");
		return rename(src, dest, overwrite);
	}
	function rename(src, dest, overwrite) {
		try {
			fs.renameSync(src, dest);
		} catch (err) {
			if (err.code !== "EXDEV") throw err;
			return moveAcrossDevice(src, dest, overwrite);
		}
	}
	function moveAcrossDevice(src, dest, overwrite) {
		copySync(src, dest, {
			overwrite,
			errorOnExist: true
		});
		return removeSync(src);
	}
	module.exports = moveSync;
}));
//#endregion
//#region node_modules/fs-extra/lib/move/index.js
var require_move = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var u = require_universalify().fromCallback;
	module.exports = {
		move: u(require_move$1()),
		moveSync: require_move_sync()
	};
}));
//#endregion
//#region node_modules/fs-extra/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		...require_fs(),
		...require_copy(),
		...require_empty(),
		...require_ensure(),
		...require_json$1(),
		...require_mkdirs(),
		...require_move(),
		...require_output_file(),
		...require_path_exists(),
		...require_remove()
	};
}));
//#endregion
//#region node_modules/builder-util-runtime/out/CancellationToken.js
var require_CancellationToken = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CancellationError = exports.CancellationToken = void 0;
	var events_1$1 = __require("events");
	var CancellationToken = class extends events_1$1.EventEmitter {
		get cancelled() {
			return this._cancelled || this._parent != null && this._parent.cancelled;
		}
		set parent(value) {
			this.removeParentCancelHandler();
			this._parent = value;
			this.parentCancelHandler = () => this.cancel();
			this._parent.onCancel(this.parentCancelHandler);
		}
		constructor(parent) {
			super();
			this.parentCancelHandler = null;
			this._parent = null;
			this._cancelled = false;
			if (parent != null) this.parent = parent;
		}
		cancel() {
			this._cancelled = true;
			this.emit("cancel");
		}
		onCancel(handler) {
			if (this.cancelled) handler();
			else this.once("cancel", handler);
		}
		createPromise(callback) {
			if (this.cancelled) return Promise.reject(new CancellationError());
			const finallyHandler = () => {
				if (cancelHandler != null) try {
					this.removeListener("cancel", cancelHandler);
					cancelHandler = null;
				} catch (_ignore) {}
			};
			let cancelHandler = null;
			return new Promise((resolve, reject) => {
				let addedCancelHandler = null;
				cancelHandler = () => {
					try {
						if (addedCancelHandler != null) {
							addedCancelHandler();
							addedCancelHandler = null;
						}
					} finally {
						reject(new CancellationError());
					}
				};
				if (this.cancelled) {
					cancelHandler();
					return;
				}
				this.onCancel(cancelHandler);
				callback(resolve, reject, (callback) => {
					addedCancelHandler = callback;
				});
			}).then((it) => {
				finallyHandler();
				return it;
			}).catch((e) => {
				finallyHandler();
				throw e;
			});
		}
		removeParentCancelHandler() {
			const parent = this._parent;
			if (parent != null && this.parentCancelHandler != null) {
				parent.removeListener("cancel", this.parentCancelHandler);
				this.parentCancelHandler = null;
			}
		}
		dispose() {
			try {
				this.removeParentCancelHandler();
			} finally {
				this.removeAllListeners();
				this._parent = null;
			}
		}
	};
	exports.CancellationToken = CancellationToken;
	var CancellationError = class extends Error {
		constructor() {
			super("cancelled");
		}
	};
	exports.CancellationError = CancellationError;
}));
//#endregion
//#region node_modules/builder-util-runtime/out/error.js
var require_error = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.newError = newError;
	function newError(message, code) {
		const error = new Error(message);
		error.code = code;
		return error;
	}
}));
//#endregion
//#region node_modules/ms/index.js
var require_ms = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Helpers.
	*/
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	module.exports = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
}));
//#endregion
//#region node_modules/debug/src/common.js
var require_common$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the common logic for both the Node.js and web browser
	* implementations of `debug()`.
	*/
	function setup(env) {
		createDebug.debug = createDebug;
		createDebug.default = createDebug;
		createDebug.coerce = coerce;
		createDebug.disable = disable;
		createDebug.enable = enable;
		createDebug.enabled = enabled;
		createDebug.humanize = require_ms();
		createDebug.destroy = destroy;
		Object.keys(env).forEach((key) => {
			createDebug[key] = env[key];
		});
		/**
		* The currently active debug mode names, and names to skip.
		*/
		createDebug.names = [];
		createDebug.skips = [];
		/**
		* Map of special "%n" handling functions, for the debug "format" argument.
		*
		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
		*/
		createDebug.formatters = {};
		/**
		* Selects a color for a debug namespace
		* @param {String} namespace The namespace string for the debug instance to be colored
		* @return {Number|String} An ANSI color code for the given namespace
		* @api private
		*/
		function selectColor(namespace) {
			let hash = 0;
			for (let i = 0; i < namespace.length; i++) {
				hash = (hash << 5) - hash + namespace.charCodeAt(i);
				hash |= 0;
			}
			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
		}
		createDebug.selectColor = selectColor;
		/**
		* Create a debugger with the given `namespace`.
		*
		* @param {String} namespace
		* @return {Function}
		* @api public
		*/
		function createDebug(namespace) {
			let prevTime;
			let enableOverride = null;
			let namespacesCache;
			let enabledCache;
			function debug(...args) {
				if (!debug.enabled) return;
				const self = debug;
				const curr = Number(/* @__PURE__ */ new Date());
				self.diff = curr - (prevTime || curr);
				self.prev = prevTime;
				self.curr = curr;
				prevTime = curr;
				args[0] = createDebug.coerce(args[0]);
				if (typeof args[0] !== "string") args.unshift("%O");
				let index = 0;
				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
					if (match === "%%") return "%";
					index++;
					const formatter = createDebug.formatters[format];
					if (typeof formatter === "function") {
						const val = args[index];
						match = formatter.call(self, val);
						args.splice(index, 1);
						index--;
					}
					return match;
				});
				createDebug.formatArgs.call(self, args);
				(self.log || createDebug.log).apply(self, args);
			}
			debug.namespace = namespace;
			debug.useColors = createDebug.useColors();
			debug.color = createDebug.selectColor(namespace);
			debug.extend = extend;
			debug.destroy = createDebug.destroy;
			Object.defineProperty(debug, "enabled", {
				enumerable: true,
				configurable: false,
				get: () => {
					if (enableOverride !== null) return enableOverride;
					if (namespacesCache !== createDebug.namespaces) {
						namespacesCache = createDebug.namespaces;
						enabledCache = createDebug.enabled(namespace);
					}
					return enabledCache;
				},
				set: (v) => {
					enableOverride = v;
				}
			});
			if (typeof createDebug.init === "function") createDebug.init(debug);
			return debug;
		}
		function extend(namespace, delimiter) {
			const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
			newDebug.log = this.log;
			return newDebug;
		}
		/**
		* Enables a debug mode by namespaces. This can include modes
		* separated by a colon and wildcards.
		*
		* @param {String} namespaces
		* @api public
		*/
		function enable(namespaces) {
			createDebug.save(namespaces);
			createDebug.namespaces = namespaces;
			createDebug.names = [];
			createDebug.skips = [];
			const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
			for (const ns of split) if (ns[0] === "-") createDebug.skips.push(ns.slice(1));
			else createDebug.names.push(ns);
		}
		/**
		* Checks if the given string matches a namespace template, honoring
		* asterisks as wildcards.
		*
		* @param {String} search
		* @param {String} template
		* @return {Boolean}
		*/
		function matchesTemplate(search, template) {
			let searchIndex = 0;
			let templateIndex = 0;
			let starIndex = -1;
			let matchIndex = 0;
			while (searchIndex < search.length) if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
				if (template[templateIndex] === "*") {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++;
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) {
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else return false;
			while (templateIndex < template.length && template[templateIndex] === "*") templateIndex++;
			return templateIndex === template.length;
		}
		/**
		* Disable debug output.
		*
		* @return {String} namespaces
		* @api public
		*/
		function disable() {
			const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
			createDebug.enable("");
			return namespaces;
		}
		/**
		* Returns true if the given mode name is enabled, false otherwise.
		*
		* @param {String} name
		* @return {Boolean}
		* @api public
		*/
		function enabled(name) {
			for (const skip of createDebug.skips) if (matchesTemplate(name, skip)) return false;
			for (const ns of createDebug.names) if (matchesTemplate(name, ns)) return true;
			return false;
		}
		/**
		* Coerce `val`.
		*
		* @param {Mixed} val
		* @return {Mixed}
		* @api private
		*/
		function coerce(val) {
			if (val instanceof Error) return val.stack || val.message;
			return val;
		}
		/**
		* XXX DO NOT USE. This is a temporary stub function.
		* XXX It WILL be removed in the next major release.
		*/
		function destroy() {
			console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
		}
		createDebug.enable(createDebug.load());
		return createDebug;
	}
	module.exports = setup;
}));
//#endregion
//#region node_modules/debug/src/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This is the web browser implementation of `debug()`.
	*/
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.storage = localstorage();
	exports.destroy = (() => {
		let warned = false;
		return () => {
			if (!warned) {
				warned = true;
				console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
			}
		};
	})();
	/**
	* Colors.
	*/
	exports.colors = [
		"#0000CC",
		"#0000FF",
		"#0033CC",
		"#0033FF",
		"#0066CC",
		"#0066FF",
		"#0099CC",
		"#0099FF",
		"#00CC00",
		"#00CC33",
		"#00CC66",
		"#00CC99",
		"#00CCCC",
		"#00CCFF",
		"#3300CC",
		"#3300FF",
		"#3333CC",
		"#3333FF",
		"#3366CC",
		"#3366FF",
		"#3399CC",
		"#3399FF",
		"#33CC00",
		"#33CC33",
		"#33CC66",
		"#33CC99",
		"#33CCCC",
		"#33CCFF",
		"#6600CC",
		"#6600FF",
		"#6633CC",
		"#6633FF",
		"#66CC00",
		"#66CC33",
		"#9900CC",
		"#9900FF",
		"#9933CC",
		"#9933FF",
		"#99CC00",
		"#99CC33",
		"#CC0000",
		"#CC0033",
		"#CC0066",
		"#CC0099",
		"#CC00CC",
		"#CC00FF",
		"#CC3300",
		"#CC3333",
		"#CC3366",
		"#CC3399",
		"#CC33CC",
		"#CC33FF",
		"#CC6600",
		"#CC6633",
		"#CC9900",
		"#CC9933",
		"#CCCC00",
		"#CCCC33",
		"#FF0000",
		"#FF0033",
		"#FF0066",
		"#FF0099",
		"#FF00CC",
		"#FF00FF",
		"#FF3300",
		"#FF3333",
		"#FF3366",
		"#FF3399",
		"#FF33CC",
		"#FF33FF",
		"#FF6600",
		"#FF6633",
		"#FF9900",
		"#FF9933",
		"#FFCC00",
		"#FFCC33"
	];
	/**
	* Currently only WebKit-based Web Inspectors, Firefox >= v31,
	* and the Firebug extension (any Firefox version) are known
	* to support "%c" CSS customizations.
	*
	* TODO: add a `localStorage` variable to explicitly enable/disable colors
	*/
	function useColors() {
		if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) return true;
		if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) return false;
		let m;
		return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
	}
	/**
	* Colorize log arguments if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
		if (!this.useColors) return;
		const c = "color: " + this.color;
		args.splice(1, 0, c, "color: inherit");
		let index = 0;
		let lastC = 0;
		args[0].replace(/%[a-zA-Z%]/g, (match) => {
			if (match === "%%") return;
			index++;
			if (match === "%c") lastC = index;
		});
		args.splice(lastC, 0, c);
	}
	/**
	* Invokes `console.debug()` when available.
	* No-op when `console.debug` is not a "function".
	* If `console.debug` is not available, falls back
	* to `console.log`.
	*
	* @api public
	*/
	exports.log = console.debug || console.log || (() => {});
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		try {
			if (namespaces) exports.storage.setItem("debug", namespaces);
			else exports.storage.removeItem("debug");
		} catch (error) {}
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		let r;
		try {
			r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
		} catch (error) {}
		if (!r && typeof process !== "undefined" && "env" in process) r = process.env.DEBUG;
		return r;
	}
	/**
	* Localstorage attempts to return the localstorage.
	*
	* This is necessary because safari throws
	* when a user disables cookies/localstorage
	* and you attempt to access it.
	*
	* @return {LocalStorage}
	* @api private
	*/
	function localstorage() {
		try {
			return localStorage;
		} catch (error) {}
	}
	module.exports = require_common$1()(exports);
	var { formatters } = module.exports;
	/**
	* Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	*/
	formatters.j = function(v) {
		try {
			return JSON.stringify(v);
		} catch (error) {
			return "[UnexpectedJSONParseError]: " + error.message;
		}
	};
}));
//#endregion
//#region node_modules/has-flag/index.js
var require_has_flag = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = (flag, argv = process.argv) => {
		const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf("--");
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
}));
//#endregion
//#region node_modules/supports-color/index.js
var require_supports_color = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var os$1 = __require("os");
	var tty$1 = __require("tty");
	var hasFlag = require_has_flag();
	var { env } = process;
	var forceColor;
	if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) forceColor = 0;
	else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) forceColor = 1;
	if ("FORCE_COLOR" in env) {
		if (env.FORCE_COLOR === "true") forceColor = 1;
		else if (env.FORCE_COLOR === "false") forceColor = 0;
		else forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
	function translateLevel(level) {
		if (level === 0) return false;
		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}
	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) return 0;
		if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
		if (hasFlag("color=256")) return 2;
		if (haveStream && !streamIsTTY && forceColor === void 0) return 0;
		const min = forceColor || 0;
		if (env.TERM === "dumb") return min;
		if (process.platform === "win32") {
			const osRelease = os$1.release().split(".");
			if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
			return 1;
		}
		if ("CI" in env) {
			if ([
				"TRAVIS",
				"CIRCLECI",
				"APPVEYOR",
				"GITLAB_CI",
				"GITHUB_ACTIONS",
				"BUILDKITE"
			].some((sign) => sign in env) || env.CI_NAME === "codeship") return 1;
			return min;
		}
		if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		if (env.COLORTERM === "truecolor") return 3;
		if ("TERM_PROGRAM" in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
			switch (env.TERM_PROGRAM) {
				case "iTerm.app": return version >= 3 ? 3 : 2;
				case "Apple_Terminal": return 2;
			}
		}
		if (/-256(color)?$/i.test(env.TERM)) return 2;
		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
		if ("COLORTERM" in env) return 1;
		return min;
	}
	function getSupportLevel(stream) {
		return translateLevel(supportsColor(stream, stream && stream.isTTY));
	}
	module.exports = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty$1.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty$1.isatty(2)))
	};
}));
//#endregion
//#region node_modules/debug/src/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Module dependencies.
	*/
	var tty = __require("tty");
	var util = __require("util");
	/**
	* This is the Node.js implementation of `debug()`.
	*/
	exports.init = init;
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
	/**
	* Colors.
	*/
	exports.colors = [
		6,
		2,
		3,
		4,
		5,
		1
	];
	try {
		const supportsColor = require_supports_color();
		if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	} catch (error) {}
	/**
	* Build up the default `inspectOpts` object from the environment variables.
	*
	*   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
	*/
	exports.inspectOpts = Object.keys(process.env).filter((key) => {
		return /^debug_/i.test(key);
	}).reduce((obj, key) => {
		const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});
		let val = process.env[key];
		if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
		else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
		else if (val === "null") val = null;
		else val = Number(val);
		obj[prop] = val;
		return obj;
	}, {});
	/**
	* Is stdout a TTY? Colored output is enabled when `true`.
	*/
	function useColors() {
		return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
	}
	/**
	* Adds ANSI color escape codes if enabled.
	*
	* @api public
	*/
	function formatArgs(args) {
		const { namespace: name, useColors } = this;
		if (useColors) {
			const c = this.color;
			const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
			const prefix = `  ${colorCode};1m${name} \u001B[0m`;
			args[0] = prefix + args[0].split("\n").join("\n" + prefix);
			args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
		} else args[0] = getDate() + name + " " + args[0];
	}
	function getDate() {
		if (exports.inspectOpts.hideDate) return "";
		return (/* @__PURE__ */ new Date()).toISOString() + " ";
	}
	/**
	* Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
	*/
	function log(...args) {
		return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
	}
	/**
	* Save `namespaces`.
	*
	* @param {String} namespaces
	* @api private
	*/
	function save(namespaces) {
		if (namespaces) process.env.DEBUG = namespaces;
		else delete process.env.DEBUG;
	}
	/**
	* Load `namespaces`.
	*
	* @return {String} returns the previously persisted debug modes
	* @api private
	*/
	function load() {
		return process.env.DEBUG;
	}
	/**
	* Init logic for `debug` instances.
	*
	* Create a new `inspectOpts` object in case `useColors` is set
	* differently for a particular `debug` instance.
	*/
	function init(debug) {
		debug.inspectOpts = {};
		const keys = Object.keys(exports.inspectOpts);
		for (let i = 0; i < keys.length; i++) debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
	module.exports = require_common$1()(exports);
	var { formatters } = module.exports;
	/**
	* Map %o to `util.inspect()`, all on a single line.
	*/
	formatters.o = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
	};
	/**
	* Map %O to `util.inspect()`, allowing multiple lines if needed.
	*/
	formatters.O = function(v) {
		this.inspectOpts.colors = this.useColors;
		return util.inspect(v, this.inspectOpts);
	};
}));
//#endregion
//#region node_modules/debug/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Detect Electron renderer / nwjs process, which is node, but we should
	* treat as a browser.
	*/
	if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) module.exports = require_browser();
	else module.exports = require_node();
}));
//#endregion
//#region node_modules/builder-util-runtime/out/ProgressCallbackTransform.js
var require_ProgressCallbackTransform = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProgressCallbackTransform = void 0;
	var stream_1$3 = __require("stream");
	var ProgressCallbackTransform = class extends stream_1$3.Transform {
		constructor(total, cancellationToken, onProgress) {
			super();
			this.total = total;
			this.cancellationToken = cancellationToken;
			this.onProgress = onProgress;
			this.start = Date.now();
			this.transferred = 0;
			this.delta = 0;
			this.nextUpdate = this.start + 1e3;
		}
		_transform(chunk, encoding, callback) {
			if (this.cancellationToken.cancelled) {
				callback(/* @__PURE__ */ new Error("cancelled"), null);
				return;
			}
			this.transferred += chunk.length;
			this.delta += chunk.length;
			const now = Date.now();
			if (now >= this.nextUpdate && this.transferred !== this.total) {
				this.nextUpdate = now + 1e3;
				this.onProgress({
					total: this.total,
					delta: this.delta,
					transferred: this.transferred,
					percent: this.transferred / this.total * 100,
					bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
				});
				this.delta = 0;
			}
			callback(null, chunk);
		}
		_flush(callback) {
			if (this.cancellationToken.cancelled) {
				callback(/* @__PURE__ */ new Error("cancelled"));
				return;
			}
			this.onProgress({
				total: this.total,
				delta: this.delta,
				transferred: this.total,
				percent: 100,
				bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
			});
			this.delta = 0;
			callback(null);
		}
	};
	exports.ProgressCallbackTransform = ProgressCallbackTransform;
}));
//#endregion
//#region node_modules/builder-util-runtime/out/httpExecutor.js
var require_httpExecutor = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DigestTransform = exports.HttpExecutor = exports.HttpError = void 0;
	exports.addSensitiveRedirectHeader = addSensitiveRedirectHeader;
	exports.addSensitiveFieldPattern = addSensitiveFieldPattern;
	exports.createHttpError = createHttpError;
	exports.parseJson = parseJson;
	exports.configureRequestOptionsFromUrl = configureRequestOptionsFromUrl;
	exports.configureRequestUrl = configureRequestUrl;
	exports.safeGetHeader = safeGetHeader;
	exports.configureRequestOptions = configureRequestOptions;
	exports.isSensitiveFieldName = isSensitiveFieldName;
	exports.hashSensitiveValue = hashSensitiveValue;
	exports.safeStringifyJson = safeStringifyJson;
	var crypto_1$4 = __require("crypto");
	var debug_1 = require_src();
	var fs_1$5 = __require("fs");
	var stream_1$2 = __require("stream");
	var url_1$7 = __require("url");
	var CancellationToken_1 = require_CancellationToken();
	var error_1 = require_error();
	var ProgressCallbackTransform_1 = require_ProgressCallbackTransform();
	var debug = (0, debug_1.default)("electron-builder");
	var normalizeName = (name) => name.toLowerCase().replace(/[-_]/g, "");
	var SENSITIVE_REDIRECT_HEADERS = /* @__PURE__ */ new Set([
		"authorization",
		"proxyauthorization",
		"privatetoken",
		"xapikey",
		"xauthtoken",
		"xaccesstoken",
		"xgitlabtoken",
		"cookie",
		"xcsrftoken"
	]);
	var SENSITIVE_FIELD_PATTERNS = [
		"token",
		"password",
		"secret",
		"authorization",
		"credential",
		"apikey",
		"passphrase",
		"auth"
	];
	var SENSITIVE_FIELD_SUFFIXES = ["key"];
	/**
	* Register an additional HTTP header to strip on cross-origin redirects.
	* Intended for custom publishers (e.g. GenericPublisher with a non-standard auth header).
	*/
	function addSensitiveRedirectHeader(header) {
		SENSITIVE_REDIRECT_HEADERS.add(normalizeName(header));
	}
	/**
	* Register an additional substring pattern used by {@link safeStringifyJson} to
	* identify sensitive field names. Input is normalized (lowercased, separators stripped).
	* Intended for custom publishers that store credentials under non-standard field names.
	*/
	function addSensitiveFieldPattern(pattern) {
		SENSITIVE_FIELD_PATTERNS.push(pattern.toLowerCase().replace(/[-_]/g, ""));
	}
	function createHttpError(response, description = null) {
		return new HttpError(response.statusCode || -1, `${response.statusCode} ${response.statusMessage}` + (description == null ? "" : "\n" + JSON.stringify(description, null, "  ")) + "\nHeaders: " + safeStringifyJson(response.headers), description);
	}
	var HTTP_STATUS_CODES = /* @__PURE__ */ new Map([
		[429, "Too many requests"],
		[400, "Bad request"],
		[403, "Forbidden"],
		[404, "Not found"],
		[405, "Method not allowed"],
		[406, "Not acceptable"],
		[408, "Request timeout"],
		[413, "Request entity too large"],
		[500, "Internal server error"],
		[502, "Bad gateway"],
		[503, "Service unavailable"],
		[504, "Gateway timeout"],
		[505, "HTTP version not supported"]
	]);
	var HttpError = class extends Error {
		constructor(statusCode, message = `HTTP error: ${HTTP_STATUS_CODES.get(statusCode) || statusCode}`, description = null) {
			super(message);
			this.statusCode = statusCode;
			this.description = description;
			this.name = "HttpError";
			this.code = `HTTP_ERROR_${statusCode}`;
		}
		isServerError() {
			return this.statusCode >= 500 && this.statusCode <= 599;
		}
	};
	exports.HttpError = HttpError;
	function parseJson(result) {
		return result.then((it) => it == null || it.length === 0 ? null : JSON.parse(it));
	}
	exports.HttpExecutor = class HttpExecutor {
		constructor() {
			this.maxRedirects = 10;
		}
		request(options, cancellationToken = new CancellationToken_1.CancellationToken(), data) {
			configureRequestOptions(options);
			const json = data == null ? void 0 : JSON.stringify(data);
			const encodedData = json ? Buffer.from(json) : void 0;
			if (encodedData != null) {
				if (debug.enabled) debug(safeStringifyJson(data));
				const { headers, ...opts } = options;
				options = {
					method: "post",
					headers: {
						"Content-Type": "application/json",
						"Content-Length": encodedData.length,
						...headers
					},
					...opts
				};
			}
			return this.doApiRequest(options, cancellationToken, (it) => it.end(encodedData));
		}
		doApiRequest(options, cancellationToken, requestProcessor, redirectCount = 0) {
			if (debug.enabled) {
				const { headers: _headers, auth: _auth, ...safeOptions } = options;
				debug(`Request: ${safeStringifyJson(safeOptions)}`);
			}
			return cancellationToken.createPromise((resolve, reject, onCancel) => {
				const request = this.createRequest(options, (response) => {
					try {
						this.handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor);
					} catch (e) {
						reject(e);
					}
				});
				this.addErrorAndTimeoutHandlers(request, reject, options.timeout);
				this.addRedirectHandlers(request, options, reject, redirectCount, (options) => {
					this.doApiRequest(options, cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
				});
				requestProcessor(request, reject);
				onCancel(() => request.abort());
			});
		}
		addRedirectHandlers(request, options, reject, redirectCount, handler) {}
		addErrorAndTimeoutHandlers(request, reject, timeout = 6e4) {
			this.addTimeOutHandler(request, reject, timeout);
			request.on("error", reject);
			request.on("aborted", () => {
				reject(/* @__PURE__ */ new Error("Request has been aborted by the server"));
			});
		}
		handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor) {
			var _a;
			if (debug.enabled) {
				const { headers: _headers, auth: _auth, ...safeOptions } = options;
				debug(`Response: ${response.statusCode} ${response.statusMessage}, request options: ${safeStringifyJson(safeOptions)}`);
			}
			if (response.statusCode === 404) {
				reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
				return;
			} else if (response.statusCode === 204) {
				resolve();
				return;
			}
			const code = (_a = response.statusCode) !== null && _a !== void 0 ? _a : 0;
			const shouldRedirect = code >= 300 && code < 400;
			const redirectUrl = safeGetHeader(response, "location");
			if (shouldRedirect && redirectUrl != null) {
				if (redirectCount > this.maxRedirects) {
					reject(this.createMaxRedirectError());
					return;
				}
				this.doApiRequest(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options), cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
				return;
			}
			response.setEncoding("utf8");
			let data = "";
			response.on("error", reject);
			response.on("data", (chunk) => data += chunk);
			response.on("end", () => {
				try {
					if (response.statusCode != null && response.statusCode >= 400) {
						const contentType = safeGetHeader(response, "content-type");
						const isJson = contentType != null && (Array.isArray(contentType) ? contentType.find((it) => it.includes("json")) != null : contentType.includes("json"));
						reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

          Data:
          ${isJson ? safeStringifyJson(JSON.parse(data)) : data}
          `));
					} else resolve(data.length === 0 ? null : data);
				} catch (e) {
					reject(e);
				}
			});
		}
		async downloadToBuffer(url, options) {
			return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
				const responseChunks = [];
				const requestOptions = {
					headers: options.headers || void 0,
					redirect: "manual"
				};
				configureRequestUrl(url, requestOptions);
				configureRequestOptions(requestOptions);
				this.doDownload(requestOptions, {
					destination: null,
					options,
					onCancel,
					callback: (error) => {
						if (error == null) resolve(Buffer.concat(responseChunks));
						else reject(error);
					},
					responseHandler: (response, callback) => {
						let receivedLength = 0;
						response.on("data", (chunk) => {
							receivedLength += chunk.length;
							if (receivedLength > 524288e3) {
								callback(/* @__PURE__ */ new Error("Maximum allowed size is 500 MB"));
								return;
							}
							responseChunks.push(chunk);
						});
						response.on("end", () => {
							callback(null);
						});
					}
				}, 0);
			});
		}
		doDownload(requestOptions, options, redirectCount) {
			const request = this.createRequest(requestOptions, (response) => {
				if (response.statusCode >= 400) {
					options.callback(/* @__PURE__ */ new Error(`Cannot download "${requestOptions.protocol || "https:"}//${requestOptions.hostname}${requestOptions.path}", status ${response.statusCode}: ${response.statusMessage}`));
					return;
				}
				response.on("error", options.callback);
				const redirectUrl = safeGetHeader(response, "location");
				if (redirectUrl != null) {
					if (redirectCount < this.maxRedirects) this.doDownload(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, requestOptions), options, redirectCount++);
					else options.callback(this.createMaxRedirectError());
					return;
				}
				if (options.responseHandler == null) configurePipes(options, response);
				else options.responseHandler(response, options.callback);
			});
			this.addErrorAndTimeoutHandlers(request, options.callback, requestOptions.timeout);
			this.addRedirectHandlers(request, requestOptions, options.callback, redirectCount, (requestOptions) => {
				this.doDownload(requestOptions, options, redirectCount++);
			});
			request.end();
		}
		createMaxRedirectError() {
			return /* @__PURE__ */ new Error(`Too many redirects (> ${this.maxRedirects})`);
		}
		addTimeOutHandler(request, callback, timeout) {
			request.on("socket", (socket) => {
				socket.setTimeout(timeout, () => {
					request.abort();
					callback(/* @__PURE__ */ new Error("Request timed out"));
				});
			});
		}
		static prepareRedirectUrlOptions(redirectUrl, options) {
			const newOptions = configureRequestOptionsFromUrl(redirectUrl, { ...options });
			const headers = newOptions.headers;
			if (headers == null) return newOptions;
			const originalUrl = HttpExecutor.reconstructOriginalUrl(options);
			const parsedRedirectUrl = parseUrl(redirectUrl, options);
			if (HttpExecutor.isCrossOriginRedirect(originalUrl, parsedRedirectUrl)) {
				if (debug.enabled) debug(`Cross-origin redirect (${originalUrl.host} → ${parsedRedirectUrl.host}): stripping sensitive headers`);
				for (const key of Object.keys(headers)) if (SENSITIVE_REDIRECT_HEADERS.has(normalizeName(key))) delete headers[key];
			}
			return newOptions;
		}
		static reconstructOriginalUrl(options) {
			const protocol = options.protocol || "https:";
			if (!options.hostname) throw new Error("Missing hostname in request options");
			const hostname = options.hostname;
			const port = options.port ? `:${options.port}` : "";
			const path = options.path || "/";
			return new url_1$7.URL(`${protocol}//${hostname}${port}${path}`);
		}
		static isCrossOriginRedirect(originalUrl, redirectUrl) {
			if (originalUrl.hostname.toLowerCase() !== redirectUrl.hostname.toLowerCase()) return true;
			if (originalUrl.protocol === "http:" && ["80", ""].includes(originalUrl.port) && redirectUrl.protocol === "https:" && ["443", ""].includes(redirectUrl.port)) return false;
			if (originalUrl.protocol !== redirectUrl.protocol) return true;
			return originalUrl.port !== redirectUrl.port;
		}
		static async retryOnServerError(task, maxRetries = 3) {
			for (let attemptNumber = 0;; attemptNumber++) try {
				return await task();
			} catch (e) {
				if (attemptNumber < maxRetries && (e instanceof HttpError && e.isServerError() || e.code === "EPIPE")) {
					await new Promise((r) => setTimeout(r, 1e3 * (attemptNumber + 1)));
					continue;
				}
				throw e;
			}
		}
	};
	function parseUrl(url, options) {
		try {
			return new url_1$7.URL(url);
		} catch {
			const hostname = options.hostname;
			const baseUrl = `${options.protocol || "https:"}//${hostname}${options.port ? `:${options.port}` : ""}`;
			return new url_1$7.URL(url, baseUrl);
		}
	}
	function configureRequestOptionsFromUrl(url, options) {
		const result = configureRequestOptions(options);
		configureRequestUrl(parseUrl(url, options), result);
		return result;
	}
	function configureRequestUrl(url, options) {
		options.protocol = url.protocol;
		options.hostname = url.hostname;
		if (url.port) options.port = url.port;
		else if (options.port) delete options.port;
		options.path = url.pathname + url.search;
	}
	var DigestTransform = class extends stream_1$2.Transform {
		get actual() {
			return this._actual;
		}
		constructor(expected, algorithm = "sha512", encoding = "base64") {
			super();
			this.expected = expected;
			this.algorithm = algorithm;
			this.encoding = encoding;
			this._actual = null;
			this.isValidateOnEnd = true;
			this.digester = (0, crypto_1$4.createHash)(algorithm);
		}
		_transform(chunk, encoding, callback) {
			this.digester.update(chunk);
			callback(null, chunk);
		}
		_flush(callback) {
			this._actual = this.digester.digest(this.encoding);
			if (this.isValidateOnEnd) try {
				this.validate();
			} catch (e) {
				callback(e);
				return;
			}
			callback(null);
		}
		validate() {
			if (this._actual == null) throw (0, error_1.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
			if (this._actual !== this.expected) throw (0, error_1.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
			return null;
		}
	};
	exports.DigestTransform = DigestTransform;
	function checkSha2(sha2Header, sha2, callback) {
		if (sha2Header != null && sha2 != null && sha2Header !== sha2) {
			callback(/* @__PURE__ */ new Error(`checksum mismatch: expected ${sha2} but got ${sha2Header} (X-Checksum-Sha2 header)`));
			return false;
		}
		return true;
	}
	function safeGetHeader(response, headerKey) {
		const value = response.headers[headerKey];
		if (value == null) return null;
		else if (Array.isArray(value)) return value.length === 0 ? null : value[value.length - 1];
		else return value;
	}
	function configurePipes(options, response) {
		if (!checkSha2(safeGetHeader(response, "X-Checksum-Sha2"), options.options.sha2, options.callback)) return;
		const streams = [];
		if (options.options.onProgress != null) {
			const contentLength = safeGetHeader(response, "content-length");
			if (contentLength != null) streams.push(new ProgressCallbackTransform_1.ProgressCallbackTransform(parseInt(contentLength, 10), options.options.cancellationToken, options.options.onProgress));
		}
		const sha512 = options.options.sha512;
		if (sha512 != null) streams.push(new DigestTransform(sha512, "sha512", sha512.length === 128 && !sha512.includes("+") && !sha512.includes("Z") && !sha512.includes("=") ? "hex" : "base64"));
		else if (options.options.sha2 != null) streams.push(new DigestTransform(options.options.sha2, "sha256", "hex"));
		const fileOut = (0, fs_1$5.createWriteStream)(options.destination);
		streams.push(fileOut);
		let lastStream = response;
		for (const stream of streams) {
			stream.on("error", (error) => {
				fileOut.close();
				if (!options.options.cancellationToken.cancelled) options.callback(error);
			});
			lastStream = lastStream.pipe(stream);
		}
		fileOut.on("finish", () => {
			fileOut.close(options.callback);
		});
	}
	function configureRequestOptions(options, token, method) {
		if (method != null) options.method = method;
		options.headers = { ...options.headers };
		const headers = options.headers;
		if (token != null) headers.authorization = token.startsWith("Basic") || token.startsWith("Bearer") ? token : `token ${token}`;
		if (headers["User-Agent"] == null) headers["User-Agent"] = "electron-builder";
		if (method == null || method === "GET" || headers["Cache-Control"] == null) headers["Cache-Control"] = "no-cache";
		if (options.protocol == null && process.versions.electron != null) options.protocol = "https:";
		return options;
	}
	function isSensitiveFieldName(name) {
		const normalized = normalizeName(name);
		return SENSITIVE_FIELD_PATTERNS.some((p) => normalized.includes(p)) || SENSITIVE_FIELD_SUFFIXES.some((s) => normalized.endsWith(s));
	}
	function hashSensitiveValue(value) {
		return `${(0, crypto_1$4.createHash)("sha256").update(value).digest("hex")} (sha256 hash)`;
	}
	function safeStringifyJson(data, skippedNames) {
		return JSON.stringify(data, (name, value) => {
			if (isSensitiveFieldName(name) || skippedNames != null && skippedNames.has(name)) return typeof value === "string" ? hashSensitiveValue(value) : "<stripped sensitive data>";
			return value;
		}, 2);
	}
}));
//#endregion
//#region node_modules/builder-util-runtime/out/MemoLazy.js
var require_MemoLazy = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MemoLazy = void 0;
	var MemoLazy = class {
		constructor(selector, creator) {
			this.selector = selector;
			this.creator = creator;
			this.selected = void 0;
			this._value = void 0;
		}
		get hasValue() {
			return this._value !== void 0;
		}
		get value() {
			const selected = this.selector();
			if (this._value !== void 0 && equals(this.selected, selected)) return this._value;
			this.selected = selected;
			const result = this.creator(selected);
			this.value = result;
			return result;
		}
		set value(value) {
			this._value = value;
		}
	};
	exports.MemoLazy = MemoLazy;
	function equals(firstValue, secondValue) {
		if (typeof firstValue === "object" && firstValue !== null && typeof secondValue === "object" && secondValue !== null) {
			const keys1 = Object.keys(firstValue);
			const keys2 = Object.keys(secondValue);
			return keys1.length === keys2.length && keys1.every((key) => equals(firstValue[key], secondValue[key]));
		}
		return firstValue === secondValue;
	}
}));
//#endregion
//#region node_modules/builder-util-runtime/out/publishOptions.js
var require_publishOptions = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.githubUrl = githubUrl;
	exports.githubTagPrefix = githubTagPrefix;
	exports.getS3LikeProviderBaseUrl = getS3LikeProviderBaseUrl;
	/** @private */
	function githubUrl(options, defaultHost = "github.com") {
		return `${options.protocol || "https"}://${options.host || defaultHost}`;
	}
	function githubTagPrefix(options) {
		var _a;
		if (options.tagNamePrefix) return options.tagNamePrefix;
		if ((_a = options.vPrefixedTagName) !== null && _a !== void 0 ? _a : true) return "v";
		return "";
	}
	function getS3LikeProviderBaseUrl(configuration) {
		const provider = configuration.provider;
		if (provider === "s3") return s3Url(configuration);
		if (provider === "spaces") return spacesUrl(configuration);
		throw new Error(`Not supported provider: ${provider}`);
	}
	function s3Url(options) {
		let url;
		if (options.accelerate == true) url = `https://${options.bucket}.s3-accelerate.amazonaws.com`;
		else if (options.endpoint != null) url = `${options.endpoint}/${options.bucket}`;
		else if (options.bucket.includes(".")) {
			if (options.region == null) throw new Error(`Bucket name "${options.bucket}" includes a dot, but S3 region is missing`);
			if (options.region === "us-east-1") url = `https://s3.amazonaws.com/${options.bucket}`;
			else url = `https://s3-${options.region}.amazonaws.com/${options.bucket}`;
		} else if (options.region === "cn-north-1") url = `https://${options.bucket}.s3.${options.region}.amazonaws.com.cn`;
		else url = `https://${options.bucket}.s3.amazonaws.com`;
		return appendPath(url, options.path);
	}
	function appendPath(url, p) {
		if (p != null && p.length > 0) {
			if (!p.startsWith("/")) url += "/";
			url += p;
		}
		return url;
	}
	function spacesUrl(options) {
		if (options.name == null) throw new Error(`name is missing`);
		if (options.region == null) throw new Error(`region is missing`);
		return appendPath(`https://${options.name}.${options.region}.digitaloceanspaces.com`, options.path);
	}
}));
//#endregion
//#region node_modules/builder-util-runtime/out/retry.js
var require_retry = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.retry = retry;
	var CancellationToken_1 = require_CancellationToken();
	async function retry(task, options) {
		var _a;
		const { retries: retryCount, interval, backoff = 0, attempt = 0, shouldRetry, cancellationToken = new CancellationToken_1.CancellationToken() } = options;
		try {
			return await task();
		} catch (error) {
			if (await Promise.resolve((_a = shouldRetry === null || shouldRetry === void 0 ? void 0 : shouldRetry(error)) !== null && _a !== void 0 ? _a : true) && retryCount > 0 && !cancellationToken.cancelled) {
				await new Promise((resolve) => setTimeout(resolve, interval + backoff * attempt));
				return await retry(task, {
					...options,
					retries: retryCount - 1,
					attempt: attempt + 1
				});
			} else throw error;
		}
	}
}));
//#endregion
//#region node_modules/builder-util-runtime/out/rfc2253Parser.js
var require_rfc2253Parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.parseDn = parseDn;
	function parseDn(seq) {
		let quoted = false;
		let key = null;
		let token = "";
		let nextNonSpace = 0;
		seq = seq.trim();
		const result = /* @__PURE__ */ new Map();
		for (let i = 0; i <= seq.length; i++) {
			if (i === seq.length) {
				if (key !== null) result.set(key, token);
				break;
			}
			const ch = seq[i];
			if (quoted) {
				if (ch === "\"") {
					quoted = false;
					continue;
				}
			} else {
				if (ch === "\"") {
					quoted = true;
					continue;
				}
				if (ch === "\\") {
					i++;
					const ord = parseInt(seq.slice(i, i + 2), 16);
					if (Number.isNaN(ord)) token += seq[i];
					else {
						i++;
						token += String.fromCharCode(ord);
					}
					continue;
				}
				if (key === null && ch === "=") {
					key = token;
					token = "";
					continue;
				}
				if (ch === "," || ch === ";" || ch === "+") {
					if (key !== null) result.set(key, token);
					key = null;
					token = "";
					continue;
				}
			}
			if (ch === " " && !quoted) {
				if (token.length === 0) continue;
				if (i > nextNonSpace) {
					let j = i;
					while (seq[j] === " ") j++;
					nextNonSpace = j;
				}
				if (nextNonSpace >= seq.length || seq[nextNonSpace] === "," || seq[nextNonSpace] === ";" || key === null && seq[nextNonSpace] === "=" || key !== null && seq[nextNonSpace] === "+") {
					i = nextNonSpace - 1;
					continue;
				}
			}
			token += ch;
		}
		return result;
	}
}));
//#endregion
//#region node_modules/builder-util-runtime/out/uuid.js
var require_uuid = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.nil = exports.UUID = void 0;
	var crypto_1$3 = __require("crypto");
	var error_1 = require_error();
	var invalidName = "options.name must be either a string or a Buffer";
	var randomHost = (0, crypto_1$3.randomBytes)(16);
	randomHost[0] = randomHost[0] | 1;
	var hex2byte = {};
	var byte2hex = [];
	for (let i = 0; i < 256; i++) {
		const hex = (i + 256).toString(16).substr(1);
		hex2byte[hex] = i;
		byte2hex[i] = hex;
	}
	var UUID = class UUID {
		constructor(uuid) {
			this.ascii = null;
			this.binary = null;
			const check = UUID.check(uuid);
			if (!check) throw new Error("not a UUID");
			this.version = check.version;
			if (check.format === "ascii") this.ascii = uuid;
			else this.binary = uuid;
		}
		static v5(name, namespace) {
			return uuidNamed(name, "sha1", 80, namespace);
		}
		toString() {
			if (this.ascii == null) this.ascii = stringify(this.binary);
			return this.ascii;
		}
		inspect() {
			return `UUID v${this.version} ${this.toString()}`;
		}
		static check(uuid, offset = 0) {
			if (typeof uuid === "string") {
				uuid = uuid.toLowerCase();
				if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(uuid)) return false;
				if (uuid === "00000000-0000-0000-0000-000000000000") return {
					version: void 0,
					variant: "nil",
					format: "ascii"
				};
				return {
					version: (hex2byte[uuid[14] + uuid[15]] & 240) >> 4,
					variant: getVariant((hex2byte[uuid[19] + uuid[20]] & 224) >> 5),
					format: "ascii"
				};
			}
			if (Buffer.isBuffer(uuid)) {
				if (uuid.length < offset + 16) return false;
				let i = 0;
				for (; i < 16; i++) if (uuid[offset + i] !== 0) break;
				if (i === 16) return {
					version: void 0,
					variant: "nil",
					format: "binary"
				};
				return {
					version: (uuid[offset + 6] & 240) >> 4,
					variant: getVariant((uuid[offset + 8] & 224) >> 5),
					format: "binary"
				};
			}
			throw (0, error_1.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
		}
		static parse(input) {
			const buffer = Buffer.allocUnsafe(16);
			let j = 0;
			for (let i = 0; i < 16; i++) {
				buffer[i] = hex2byte[input[j++] + input[j++]];
				if (i === 3 || i === 5 || i === 7 || i === 9) j += 1;
			}
			return buffer;
		}
	};
	exports.UUID = UUID;
	UUID.OID = UUID.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
	function getVariant(bits) {
		switch (bits) {
			case 0:
			case 1:
			case 3: return "ncs";
			case 4:
			case 5: return "rfc4122";
			case 6: return "microsoft";
			default: return "future";
		}
	}
	var UuidEncoding;
	(function(UuidEncoding) {
		UuidEncoding[UuidEncoding["ASCII"] = 0] = "ASCII";
		UuidEncoding[UuidEncoding["BINARY"] = 1] = "BINARY";
		UuidEncoding[UuidEncoding["OBJECT"] = 2] = "OBJECT";
	})(UuidEncoding || (UuidEncoding = {}));
	function uuidNamed(name, hashMethod, version, namespace, encoding = UuidEncoding.ASCII) {
		const hash = (0, crypto_1$3.createHash)(hashMethod);
		if (typeof name !== "string" && !Buffer.isBuffer(name)) throw (0, error_1.newError)(invalidName, "ERR_INVALID_UUID_NAME");
		hash.update(namespace);
		hash.update(name);
		const buffer = hash.digest();
		let result;
		switch (encoding) {
			case UuidEncoding.BINARY:
				buffer[6] = buffer[6] & 15 | version;
				buffer[8] = buffer[8] & 63 | 128;
				result = buffer;
				break;
			case UuidEncoding.OBJECT:
				buffer[6] = buffer[6] & 15 | version;
				buffer[8] = buffer[8] & 63 | 128;
				result = new UUID(buffer);
				break;
			default: result = byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6] & 15 | version] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8] & 63 | 128] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
		}
		return result;
	}
	function stringify(buffer) {
		return byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6]] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8]] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
	}
	exports.nil = new UUID("00000000-0000-0000-0000-000000000000");
}));
//#endregion
//#region node_modules/sax/lib/sax.js
var require_sax = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function(sax) {
		sax.parser = function(strict, opt) {
			return new SAXParser(strict, opt);
		};
		sax.SAXParser = SAXParser;
		sax.SAXStream = SAXStream;
		sax.createStream = createStream;
		sax.MAX_BUFFER_LENGTH = 65536;
		var buffers = [
			"comment",
			"sgmlDecl",
			"textNode",
			"tagName",
			"doctype",
			"procInstName",
			"procInstBody",
			"entity",
			"attribName",
			"attribValue",
			"cdata",
			"script"
		];
		sax.EVENTS = [
			"text",
			"processinginstruction",
			"sgmldeclaration",
			"doctype",
			"comment",
			"opentagstart",
			"attribute",
			"opentag",
			"closetag",
			"opencdata",
			"cdata",
			"closecdata",
			"error",
			"end",
			"ready",
			"script",
			"opennamespace",
			"closenamespace"
		];
		function SAXParser(strict, opt) {
			if (!(this instanceof SAXParser)) return new SAXParser(strict, opt);
			var parser = this;
			clearBuffers(parser);
			parser.q = parser.c = "";
			parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
			parser.encoding = null;
			parser.opt = opt || {};
			parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
			parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
			parser.opt.maxEntityCount = parser.opt.maxEntityCount || 512;
			parser.opt.maxEntityDepth = parser.opt.maxEntityDepth || 4;
			parser.entityCount = parser.entityDepth = 0;
			parser.tags = [];
			parser.closed = parser.closedRoot = parser.sawRoot = false;
			parser.tag = parser.error = null;
			parser.strict = !!strict;
			parser.noscript = !!(strict || parser.opt.noscript);
			parser.state = S.BEGIN;
			parser.strictEntities = parser.opt.strictEntities;
			parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES);
			parser.attribList = [];
			if (parser.opt.xmlns) parser.ns = Object.create(rootNS);
			if (parser.opt.unquotedAttributeValues === void 0) parser.opt.unquotedAttributeValues = !strict;
			parser.trackPosition = parser.opt.position !== false;
			if (parser.trackPosition) parser.position = parser.line = parser.column = 0;
			emit(parser, "onready");
		}
		if (!Object.create) Object.create = function(o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
		if (!Object.keys) Object.keys = function(o) {
			var a = [];
			for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
			return a;
		};
		function checkBufferLength(parser) {
			var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
			var maxActual = 0;
			for (var i = 0, l = buffers.length; i < l; i++) {
				var len = parser[buffers[i]].length;
				if (len > maxAllowed) switch (buffers[i]) {
					case "textNode":
						closeText(parser);
						break;
					case "cdata":
						emitNode(parser, "oncdata", parser.cdata);
						parser.cdata = "";
						break;
					case "script":
						emitNode(parser, "onscript", parser.script);
						parser.script = "";
						break;
					default: error(parser, "Max buffer length exceeded: " + buffers[i]);
				}
				maxActual = Math.max(maxActual, len);
			}
			parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH - maxActual + parser.position;
		}
		function clearBuffers(parser) {
			for (var i = 0, l = buffers.length; i < l; i++) parser[buffers[i]] = "";
		}
		function flushBuffers(parser) {
			closeText(parser);
			if (parser.cdata !== "") {
				emitNode(parser, "oncdata", parser.cdata);
				parser.cdata = "";
			}
			if (parser.script !== "") {
				emitNode(parser, "onscript", parser.script);
				parser.script = "";
			}
		}
		SAXParser.prototype = {
			end: function() {
				end(this);
			},
			write,
			resume: function() {
				this.error = null;
				return this;
			},
			close: function() {
				return this.write(null);
			},
			flush: function() {
				flushBuffers(this);
			}
		};
		var Stream;
		try {
			Stream = __require("stream").Stream;
		} catch (ex) {
			Stream = function() {};
		}
		if (!Stream) Stream = function() {};
		var streamWraps = sax.EVENTS.filter(function(ev) {
			return ev !== "error" && ev !== "end";
		});
		function createStream(strict, opt) {
			return new SAXStream(strict, opt);
		}
		function determineBufferEncoding(data, isEnd) {
			if (data.length >= 2) {
				if (data[0] === 255 && data[1] === 254) return "utf-16le";
				if (data[0] === 254 && data[1] === 255) return "utf-16be";
			}
			if (data.length >= 3 && data[0] === 239 && data[1] === 187 && data[2] === 191) return "utf8";
			if (data.length >= 4) {
				if (data[0] === 60 && data[1] === 0 && data[2] === 63 && data[3] === 0) return "utf-16le";
				if (data[0] === 0 && data[1] === 60 && data[2] === 0 && data[3] === 63) return "utf-16be";
				return "utf8";
			}
			return isEnd ? "utf8" : null;
		}
		function SAXStream(strict, opt) {
			if (!(this instanceof SAXStream)) return new SAXStream(strict, opt);
			Stream.apply(this);
			this._parser = new SAXParser(strict, opt);
			this.writable = true;
			this.readable = true;
			var me = this;
			this._parser.onend = function() {
				me.emit("end");
			};
			this._parser.onerror = function(er) {
				me.emit("error", er);
				me._parser.error = null;
			};
			this._decoder = null;
			this._decoderBuffer = null;
			streamWraps.forEach(function(ev) {
				Object.defineProperty(me, "on" + ev, {
					get: function() {
						return me._parser["on" + ev];
					},
					set: function(h) {
						if (!h) {
							me.removeAllListeners(ev);
							me._parser["on" + ev] = h;
							return h;
						}
						me.on(ev, h);
					},
					enumerable: true,
					configurable: false
				});
			});
		}
		SAXStream.prototype = Object.create(Stream.prototype, { constructor: { value: SAXStream } });
		SAXStream.prototype._decodeBuffer = function(data, isEnd) {
			if (this._decoderBuffer) {
				data = Buffer.concat([this._decoderBuffer, data]);
				this._decoderBuffer = null;
			}
			if (!this._decoder) {
				var encoding = determineBufferEncoding(data, isEnd);
				if (!encoding) {
					this._decoderBuffer = data;
					return "";
				}
				this._parser.encoding = encoding;
				this._decoder = new TextDecoder(encoding);
			}
			return this._decoder.decode(data, { stream: !isEnd });
		};
		SAXStream.prototype.write = function(data) {
			if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) data = this._decodeBuffer(data, false);
			else if (this._decoderBuffer) {
				var remaining = this._decodeBuffer(Buffer.alloc(0), true);
				if (remaining) {
					this._parser.write(remaining);
					this.emit("data", remaining);
				}
			}
			this._parser.write(data.toString());
			this.emit("data", data);
			return true;
		};
		SAXStream.prototype.end = function(chunk) {
			if (chunk && chunk.length) this.write(chunk);
			if (this._decoderBuffer) {
				var finalChunk = this._decodeBuffer(Buffer.alloc(0), true);
				if (finalChunk) {
					this._parser.write(finalChunk);
					this.emit("data", finalChunk);
				}
			} else if (this._decoder) {
				var remaining = this._decoder.decode();
				if (remaining) {
					this._parser.write(remaining);
					this.emit("data", remaining);
				}
			}
			this._parser.end();
			return true;
		};
		SAXStream.prototype.on = function(ev, handler) {
			var me = this;
			if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) me._parser["on" + ev] = function() {
				var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
				args.splice(0, 0, ev);
				me.emit.apply(me, args);
			};
			return Stream.prototype.on.call(me, ev, handler);
		};
		var CDATAre = /^\[CDATA\[$/i;
		var DOCTYPEre = /^DOCTYPE$/i;
		var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
		var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
		var rootNS = {
			xml: XML_NAMESPACE,
			xmlns: XMLNS_NAMESPACE
		};
		var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
		var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
		var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
		var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
		function isWhitespace(c) {
			return c === " " || c === "\n" || c === "\r" || c === "	";
		}
		function isQuote(c) {
			return c === "\"" || c === "'";
		}
		function isAttribEnd(c) {
			return c === ">" || isWhitespace(c);
		}
		function isMatch(regex, c) {
			return regex.test(c);
		}
		function notMatch(regex, c) {
			return !isMatch(regex, c);
		}
		var S = 0;
		sax.STATE = {
			BEGIN: S++,
			BEGIN_WHITESPACE: S++,
			TEXT: S++,
			TEXT_ENTITY: S++,
			OPEN_WAKA: S++,
			SGML_DECL: S++,
			SGML_DECL_QUOTED: S++,
			DOCTYPE: S++,
			DOCTYPE_QUOTED: S++,
			DOCTYPE_DTD: S++,
			DOCTYPE_DTD_QUOTED: S++,
			COMMENT_STARTING: S++,
			COMMENT: S++,
			COMMENT_ENDING: S++,
			COMMENT_ENDED: S++,
			CDATA: S++,
			CDATA_ENDING: S++,
			CDATA_ENDING_2: S++,
			PROC_INST: S++,
			PROC_INST_BODY: S++,
			PROC_INST_ENDING: S++,
			OPEN_TAG: S++,
			OPEN_TAG_SLASH: S++,
			ATTRIB: S++,
			ATTRIB_NAME: S++,
			ATTRIB_NAME_SAW_WHITE: S++,
			ATTRIB_VALUE: S++,
			ATTRIB_VALUE_QUOTED: S++,
			ATTRIB_VALUE_CLOSED: S++,
			ATTRIB_VALUE_UNQUOTED: S++,
			ATTRIB_VALUE_ENTITY_Q: S++,
			ATTRIB_VALUE_ENTITY_U: S++,
			CLOSE_TAG: S++,
			CLOSE_TAG_SAW_WHITE: S++,
			SCRIPT: S++,
			SCRIPT_ENDING: S++
		};
		sax.XML_ENTITIES = Object.assign(Object.create(null), {
			amp: "&",
			gt: ">",
			lt: "<",
			quot: "\"",
			apos: "'"
		});
		sax.ENTITIES = Object.assign(Object.create(null), {
			amp: "&",
			gt: ">",
			lt: "<",
			quot: "\"",
			apos: "'",
			AElig: 198,
			Aacute: 193,
			Acirc: 194,
			Agrave: 192,
			Aring: 197,
			Atilde: 195,
			Auml: 196,
			Ccedil: 199,
			ETH: 208,
			Eacute: 201,
			Ecirc: 202,
			Egrave: 200,
			Euml: 203,
			Iacute: 205,
			Icirc: 206,
			Igrave: 204,
			Iuml: 207,
			Ntilde: 209,
			Oacute: 211,
			Ocirc: 212,
			Ograve: 210,
			Oslash: 216,
			Otilde: 213,
			Ouml: 214,
			THORN: 222,
			Uacute: 218,
			Ucirc: 219,
			Ugrave: 217,
			Uuml: 220,
			Yacute: 221,
			aacute: 225,
			acirc: 226,
			aelig: 230,
			agrave: 224,
			aring: 229,
			atilde: 227,
			auml: 228,
			ccedil: 231,
			eacute: 233,
			ecirc: 234,
			egrave: 232,
			eth: 240,
			euml: 235,
			iacute: 237,
			icirc: 238,
			igrave: 236,
			iuml: 239,
			ntilde: 241,
			oacute: 243,
			ocirc: 244,
			ograve: 242,
			oslash: 248,
			otilde: 245,
			ouml: 246,
			szlig: 223,
			thorn: 254,
			uacute: 250,
			ucirc: 251,
			ugrave: 249,
			uuml: 252,
			yacute: 253,
			yuml: 255,
			copy: 169,
			reg: 174,
			nbsp: 160,
			iexcl: 161,
			cent: 162,
			pound: 163,
			curren: 164,
			yen: 165,
			brvbar: 166,
			sect: 167,
			uml: 168,
			ordf: 170,
			laquo: 171,
			not: 172,
			shy: 173,
			macr: 175,
			deg: 176,
			plusmn: 177,
			sup1: 185,
			sup2: 178,
			sup3: 179,
			acute: 180,
			micro: 181,
			para: 182,
			middot: 183,
			cedil: 184,
			ordm: 186,
			raquo: 187,
			frac14: 188,
			frac12: 189,
			frac34: 190,
			iquest: 191,
			times: 215,
			divide: 247,
			OElig: 338,
			oelig: 339,
			Scaron: 352,
			scaron: 353,
			Yuml: 376,
			fnof: 402,
			circ: 710,
			tilde: 732,
			Alpha: 913,
			Beta: 914,
			Gamma: 915,
			Delta: 916,
			Epsilon: 917,
			Zeta: 918,
			Eta: 919,
			Theta: 920,
			Iota: 921,
			Kappa: 922,
			Lambda: 923,
			Mu: 924,
			Nu: 925,
			Xi: 926,
			Omicron: 927,
			Pi: 928,
			Rho: 929,
			Sigma: 931,
			Tau: 932,
			Upsilon: 933,
			Phi: 934,
			Chi: 935,
			Psi: 936,
			Omega: 937,
			alpha: 945,
			beta: 946,
			gamma: 947,
			delta: 948,
			epsilon: 949,
			zeta: 950,
			eta: 951,
			theta: 952,
			iota: 953,
			kappa: 954,
			lambda: 955,
			mu: 956,
			nu: 957,
			xi: 958,
			omicron: 959,
			pi: 960,
			rho: 961,
			sigmaf: 962,
			sigma: 963,
			tau: 964,
			upsilon: 965,
			phi: 966,
			chi: 967,
			psi: 968,
			omega: 969,
			thetasym: 977,
			upsih: 978,
			piv: 982,
			ensp: 8194,
			emsp: 8195,
			thinsp: 8201,
			zwnj: 8204,
			zwj: 8205,
			lrm: 8206,
			rlm: 8207,
			ndash: 8211,
			mdash: 8212,
			lsquo: 8216,
			rsquo: 8217,
			sbquo: 8218,
			ldquo: 8220,
			rdquo: 8221,
			bdquo: 8222,
			dagger: 8224,
			Dagger: 8225,
			bull: 8226,
			hellip: 8230,
			permil: 8240,
			prime: 8242,
			Prime: 8243,
			lsaquo: 8249,
			rsaquo: 8250,
			oline: 8254,
			frasl: 8260,
			euro: 8364,
			image: 8465,
			weierp: 8472,
			real: 8476,
			trade: 8482,
			alefsym: 8501,
			larr: 8592,
			uarr: 8593,
			rarr: 8594,
			darr: 8595,
			harr: 8596,
			crarr: 8629,
			lArr: 8656,
			uArr: 8657,
			rArr: 8658,
			dArr: 8659,
			hArr: 8660,
			forall: 8704,
			part: 8706,
			exist: 8707,
			empty: 8709,
			nabla: 8711,
			isin: 8712,
			notin: 8713,
			ni: 8715,
			prod: 8719,
			sum: 8721,
			minus: 8722,
			lowast: 8727,
			radic: 8730,
			prop: 8733,
			infin: 8734,
			ang: 8736,
			and: 8743,
			or: 8744,
			cap: 8745,
			cup: 8746,
			int: 8747,
			there4: 8756,
			sim: 8764,
			cong: 8773,
			asymp: 8776,
			ne: 8800,
			equiv: 8801,
			le: 8804,
			ge: 8805,
			sub: 8834,
			sup: 8835,
			nsub: 8836,
			sube: 8838,
			supe: 8839,
			oplus: 8853,
			otimes: 8855,
			perp: 8869,
			sdot: 8901,
			lceil: 8968,
			rceil: 8969,
			lfloor: 8970,
			rfloor: 8971,
			lang: 9001,
			rang: 9002,
			loz: 9674,
			spades: 9824,
			clubs: 9827,
			hearts: 9829,
			diams: 9830
		});
		Object.keys(sax.ENTITIES).forEach(function(key) {
			var e = sax.ENTITIES[key];
			var s = typeof e === "number" ? String.fromCharCode(e) : e;
			sax.ENTITIES[key] = s;
		});
		for (var s in sax.STATE) sax.STATE[sax.STATE[s]] = s;
		S = sax.STATE;
		function emit(parser, event, data) {
			parser[event] && parser[event](data);
		}
		function getDeclaredEncoding(body) {
			var match = body && body.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
			return match ? match[2] : null;
		}
		function normalizeEncodingName(encoding) {
			if (!encoding) return null;
			return encoding.toLowerCase().replace(/[^a-z0-9]/g, "");
		}
		function encodingsMatch(detectedEncoding, declaredEncoding) {
			const detected = normalizeEncodingName(detectedEncoding);
			const declared = normalizeEncodingName(declaredEncoding);
			if (!detected || !declared) return true;
			if (declared === "utf16") return detected === "utf16le" || detected === "utf16be";
			return detected === declared;
		}
		function validateXmlDeclarationEncoding(parser, data) {
			if (!parser.strict || !parser.encoding || !data || data.name !== "xml") return;
			var declaredEncoding = getDeclaredEncoding(data.body);
			if (declaredEncoding && !encodingsMatch(parser.encoding, declaredEncoding)) strictFail(parser, "XML declaration encoding " + declaredEncoding + " does not match detected stream encoding " + parser.encoding.toUpperCase());
		}
		function emitNode(parser, nodeType, data) {
			if (parser.textNode) closeText(parser);
			emit(parser, nodeType, data);
		}
		function closeText(parser) {
			parser.textNode = textopts(parser.opt, parser.textNode);
			if (parser.textNode) emit(parser, "ontext", parser.textNode);
			parser.textNode = "";
		}
		function textopts(opt, text) {
			if (opt.trim) text = text.trim();
			if (opt.normalize) text = text.replace(/\s+/g, " ");
			return text;
		}
		function error(parser, er) {
			closeText(parser);
			if (parser.trackPosition) er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
			er = new Error(er);
			parser.error = er;
			emit(parser, "onerror", er);
			return parser;
		}
		function end(parser) {
			if (parser.sawRoot && !parser.closedRoot) strictFail(parser, "Unclosed root tag");
			if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) error(parser, "Unexpected end");
			closeText(parser);
			parser.c = "";
			parser.closed = true;
			emit(parser, "onend");
			SAXParser.call(parser, parser.strict, parser.opt);
			return parser;
		}
		function strictFail(parser, message) {
			if (typeof parser !== "object" || !(parser instanceof SAXParser)) throw new Error("bad call to strictFail");
			if (parser.strict) error(parser, message);
		}
		function newTag(parser) {
			if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
			var parent = parser.tags[parser.tags.length - 1] || parser;
			var tag = parser.tag = {
				name: parser.tagName,
				attributes: {}
			};
			if (parser.opt.xmlns) tag.ns = parent.ns;
			parser.attribList.length = 0;
			emitNode(parser, "onopentagstart", tag);
		}
		function qname(name, attribute) {
			var qualName = name.indexOf(":") < 0 ? ["", name] : name.split(":");
			var prefix = qualName[0];
			var local = qualName[1];
			if (attribute && name === "xmlns") {
				prefix = "xmlns";
				local = "";
			}
			return {
				prefix,
				local
			};
		}
		function attrib(parser) {
			if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]();
			if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
				parser.attribName = parser.attribValue = "";
				return;
			}
			if (parser.opt.xmlns) {
				var qn = qname(parser.attribName, true);
				var prefix = qn.prefix;
				var local = qn.local;
				if (prefix === "xmlns") {
					if (local === "xml" && parser.attribValue !== XML_NAMESPACE) strictFail(parser, "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue);
					else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) strictFail(parser, "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue);
					else {
						var tag = parser.tag;
						var parent = parser.tags[parser.tags.length - 1] || parser;
						if (tag.ns === parent.ns) tag.ns = Object.create(parent.ns);
						tag.ns[local] = parser.attribValue;
					}
				}
				parser.attribList.push([parser.attribName, parser.attribValue]);
			} else {
				parser.tag.attributes[parser.attribName] = parser.attribValue;
				emitNode(parser, "onattribute", {
					name: parser.attribName,
					value: parser.attribValue
				});
			}
			parser.attribName = parser.attribValue = "";
		}
		function openTag(parser, selfClosing) {
			if (parser.opt.xmlns) {
				var tag = parser.tag;
				var qn = qname(parser.tagName);
				tag.prefix = qn.prefix;
				tag.local = qn.local;
				tag.uri = tag.ns[qn.prefix] || "";
				if (tag.prefix && !tag.uri) {
					strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(parser.tagName));
					tag.uri = qn.prefix;
				}
				var parent = parser.tags[parser.tags.length - 1] || parser;
				if (tag.ns && parent.ns !== tag.ns) Object.keys(tag.ns).forEach(function(p) {
					emitNode(parser, "onopennamespace", {
						prefix: p,
						uri: tag.ns[p]
					});
				});
				for (var i = 0, l = parser.attribList.length; i < l; i++) {
					var nv = parser.attribList[i];
					var name = nv[0];
					var value = nv[1];
					var qualName = qname(name, true);
					var prefix = qualName.prefix;
					var local = qualName.local;
					var uri = prefix === "" ? "" : tag.ns[prefix] || "";
					var a = {
						name,
						value,
						prefix,
						local,
						uri
					};
					if (prefix && prefix !== "xmlns" && !uri) {
						strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(prefix));
						a.uri = prefix;
					}
					parser.tag.attributes[name] = a;
					emitNode(parser, "onattribute", a);
				}
				parser.attribList.length = 0;
			}
			parser.tag.isSelfClosing = !!selfClosing;
			parser.sawRoot = true;
			parser.tags.push(parser.tag);
			emitNode(parser, "onopentag", parser.tag);
			if (!selfClosing) {
				if (!parser.noscript && parser.tagName.toLowerCase() === "script") parser.state = S.SCRIPT;
				else parser.state = S.TEXT;
				parser.tag = null;
				parser.tagName = "";
			}
			parser.attribName = parser.attribValue = "";
			parser.attribList.length = 0;
		}
		function closeTag(parser) {
			if (!parser.tagName) {
				strictFail(parser, "Weird empty close tag.");
				parser.textNode += "</>";
				parser.state = S.TEXT;
				return;
			}
			if (parser.script) {
				if (parser.tagName !== "script") {
					parser.script += "</" + parser.tagName + ">";
					parser.tagName = "";
					parser.state = S.SCRIPT;
					return;
				}
				emitNode(parser, "onscript", parser.script);
				parser.script = "";
			}
			var t = parser.tags.length;
			var tagName = parser.tagName;
			if (!parser.strict) tagName = tagName[parser.looseCase]();
			var closeTo = tagName;
			while (t--) if (parser.tags[t].name !== closeTo) strictFail(parser, "Unexpected close tag");
			else break;
			if (t < 0) {
				strictFail(parser, "Unmatched closing tag: " + parser.tagName);
				parser.textNode += "</" + parser.tagName + ">";
				parser.state = S.TEXT;
				return;
			}
			parser.tagName = tagName;
			var s = parser.tags.length;
			while (s-- > t) {
				var tag = parser.tag = parser.tags.pop();
				parser.tagName = parser.tag.name;
				emitNode(parser, "onclosetag", parser.tagName);
				var x = {};
				for (var i in tag.ns) x[i] = tag.ns[i];
				var parent = parser.tags[parser.tags.length - 1] || parser;
				if (parser.opt.xmlns && tag.ns !== parent.ns) Object.keys(tag.ns).forEach(function(p) {
					var n = tag.ns[p];
					emitNode(parser, "onclosenamespace", {
						prefix: p,
						uri: n
					});
				});
			}
			if (t === 0) parser.closedRoot = true;
			parser.tagName = parser.attribValue = parser.attribName = "";
			parser.attribList.length = 0;
			parser.state = S.TEXT;
		}
		function parseEntity(parser) {
			var entity = parser.entity;
			var entityLC = entity.toLowerCase();
			var num;
			var numStr = "";
			if (parser.ENTITIES[entity]) return parser.ENTITIES[entity];
			if (parser.ENTITIES[entityLC]) return parser.ENTITIES[entityLC];
			entity = entityLC;
			if (entity.charAt(0) === "#") {
				if (entity.charAt(1) === "x") {
					entity = entity.slice(2);
					num = parseInt(entity, 16);
					numStr = num.toString(16);
				} else {
					entity = entity.slice(1);
					num = parseInt(entity, 10);
					numStr = num.toString(10);
				}
			}
			entity = entity.replace(/^0+/, "");
			if (isNaN(num) || numStr.toLowerCase() !== entity || num < 0 || num > 1114111 || !isXmlChar(num)) {
				strictFail(parser, "Invalid character entity");
				return "&" + parser.entity + ";";
			}
			return String.fromCodePoint(num);
		}
		function isXmlChar(num) {
			return num === 9 || num === 10 || num === 13 || num >= 32 && num <= 55295 || num >= 57344 && num <= 65533 || num >= 65536 && num <= 1114111;
		}
		function beginWhiteSpace(parser, c) {
			if (c === "<") {
				parser.state = S.OPEN_WAKA;
				parser.startTagPosition = parser.position;
			} else if (!isWhitespace(c)) {
				strictFail(parser, "Non-whitespace before first tag.");
				parser.textNode = c;
				parser.state = S.TEXT;
			}
		}
		function charAt(chunk, i) {
			var result = "";
			if (i < chunk.length) result = chunk.charAt(i);
			return result;
		}
		function write(chunk) {
			var parser = this;
			if (this.error) throw this.error;
			if (parser.closed) return error(parser, "Cannot write after close. Assign an onready handler.");
			if (chunk === null) return end(parser);
			if (typeof chunk === "object") chunk = chunk.toString();
			var i = 0;
			var c = "";
			while (true) {
				c = charAt(chunk, i++);
				parser.c = c;
				if (!c) break;
				if (parser.trackPosition) {
					parser.position++;
					if (c === "\n") {
						parser.line++;
						parser.column = 0;
					} else parser.column++;
				}
				switch (parser.state) {
					case S.BEGIN:
						parser.state = S.BEGIN_WHITESPACE;
						if (c === "﻿") continue;
						beginWhiteSpace(parser, c);
						continue;
					case S.BEGIN_WHITESPACE:
						beginWhiteSpace(parser, c);
						continue;
					case S.TEXT:
						if (parser.sawRoot && !parser.closedRoot) {
							var starti = i - 1;
							while (c && c !== "<" && c !== "&") {
								c = charAt(chunk, i++);
								if (c && parser.trackPosition) {
									parser.position++;
									if (c === "\n") {
										parser.line++;
										parser.column = 0;
									} else parser.column++;
								}
							}
							parser.textNode += chunk.substring(starti, i - 1);
						}
						if (c === "<" && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
							parser.state = S.OPEN_WAKA;
							parser.startTagPosition = parser.position;
						} else {
							if (!isWhitespace(c) && (!parser.sawRoot || parser.closedRoot)) strictFail(parser, "Text data outside of root node.");
							if (c === "&") parser.state = S.TEXT_ENTITY;
							else parser.textNode += c;
						}
						continue;
					case S.SCRIPT:
						if (c === "<") parser.state = S.SCRIPT_ENDING;
						else parser.script += c;
						continue;
					case S.SCRIPT_ENDING:
						if (c === "/") parser.state = S.CLOSE_TAG;
						else {
							parser.script += "<" + c;
							parser.state = S.SCRIPT;
						}
						continue;
					case S.OPEN_WAKA:
						if (c === "!") {
							parser.state = S.SGML_DECL;
							parser.sgmlDecl = "";
						} else if (isWhitespace(c)) {} else if (isMatch(nameStart, c)) {
							parser.state = S.OPEN_TAG;
							parser.tagName = c;
						} else if (c === "/") {
							parser.state = S.CLOSE_TAG;
							parser.tagName = "";
						} else if (c === "?") {
							parser.state = S.PROC_INST;
							parser.procInstName = parser.procInstBody = "";
						} else {
							strictFail(parser, "Unencoded <");
							if (parser.startTagPosition + 1 < parser.position) {
								var pad = parser.position - parser.startTagPosition;
								c = new Array(pad).join(" ") + c;
							}
							parser.textNode += "<" + c;
							parser.state = S.TEXT;
						}
						continue;
					case S.SGML_DECL:
						if (parser.sgmlDecl + c === "--") {
							parser.state = S.COMMENT;
							parser.comment = "";
							parser.sgmlDecl = "";
							continue;
						}
						if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
							parser.state = S.DOCTYPE_DTD;
							parser.doctype += "<!" + parser.sgmlDecl + c;
							parser.sgmlDecl = "";
						} else if (CDATAre.test(parser.sgmlDecl + c)) {
							emitNode(parser, "onopencdata");
							parser.state = S.CDATA;
							parser.sgmlDecl = "";
							parser.cdata = "";
						} else if (DOCTYPEre.test(parser.sgmlDecl + c)) {
							parser.state = S.DOCTYPE;
							if (parser.doctype || parser.sawRoot) strictFail(parser, "Inappropriately located doctype declaration");
							parser.doctype = "";
							parser.sgmlDecl = "";
						} else if (c === ">") {
							emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
							parser.sgmlDecl = "";
							parser.state = S.TEXT;
						} else if (isQuote(c)) {
							parser.state = S.SGML_DECL_QUOTED;
							parser.sgmlDecl += c;
						} else parser.sgmlDecl += c;
						continue;
					case S.SGML_DECL_QUOTED:
						if (c === parser.q) {
							parser.state = S.SGML_DECL;
							parser.q = "";
						}
						parser.sgmlDecl += c;
						continue;
					case S.DOCTYPE:
						if (c === ">") {
							parser.state = S.TEXT;
							emitNode(parser, "ondoctype", parser.doctype);
							parser.doctype = true;
						} else {
							parser.doctype += c;
							if (c === "[") parser.state = S.DOCTYPE_DTD;
							else if (isQuote(c)) {
								parser.state = S.DOCTYPE_QUOTED;
								parser.q = c;
							}
						}
						continue;
					case S.DOCTYPE_QUOTED:
						parser.doctype += c;
						if (c === parser.q) {
							parser.q = "";
							parser.state = S.DOCTYPE;
						}
						continue;
					case S.DOCTYPE_DTD:
						if (c === "]") {
							parser.doctype += c;
							parser.state = S.DOCTYPE;
						} else if (c === "<") {
							parser.state = S.OPEN_WAKA;
							parser.startTagPosition = parser.position;
						} else if (isQuote(c)) {
							parser.doctype += c;
							parser.state = S.DOCTYPE_DTD_QUOTED;
							parser.q = c;
						} else parser.doctype += c;
						continue;
					case S.DOCTYPE_DTD_QUOTED:
						parser.doctype += c;
						if (c === parser.q) {
							parser.state = S.DOCTYPE_DTD;
							parser.q = "";
						}
						continue;
					case S.COMMENT:
						if (c === "-") parser.state = S.COMMENT_ENDING;
						else parser.comment += c;
						continue;
					case S.COMMENT_ENDING:
						if (c === "-") {
							parser.state = S.COMMENT_ENDED;
							parser.comment = textopts(parser.opt, parser.comment);
							if (parser.comment) emitNode(parser, "oncomment", parser.comment);
							parser.comment = "";
						} else {
							parser.comment += "-" + c;
							parser.state = S.COMMENT;
						}
						continue;
					case S.COMMENT_ENDED:
						if (c !== ">") {
							strictFail(parser, "Malformed comment");
							parser.comment += "--" + c;
							parser.state = S.COMMENT;
						} else if (parser.doctype && parser.doctype !== true) parser.state = S.DOCTYPE_DTD;
						else parser.state = S.TEXT;
						continue;
					case S.CDATA:
						var starti = i - 1;
						while (c && c !== "]") {
							c = charAt(chunk, i++);
							if (c && parser.trackPosition) {
								parser.position++;
								if (c === "\n") {
									parser.line++;
									parser.column = 0;
								} else parser.column++;
							}
						}
						parser.cdata += chunk.substring(starti, i - 1);
						if (c === "]") parser.state = S.CDATA_ENDING;
						continue;
					case S.CDATA_ENDING:
						if (c === "]") parser.state = S.CDATA_ENDING_2;
						else {
							parser.cdata += "]" + c;
							parser.state = S.CDATA;
						}
						continue;
					case S.CDATA_ENDING_2:
						if (c === ">") {
							if (parser.cdata) emitNode(parser, "oncdata", parser.cdata);
							emitNode(parser, "onclosecdata");
							parser.cdata = "";
							parser.state = S.TEXT;
						} else if (c === "]") parser.cdata += "]";
						else {
							parser.cdata += "]]" + c;
							parser.state = S.CDATA;
						}
						continue;
					case S.PROC_INST:
						if (c === "?") parser.state = S.PROC_INST_ENDING;
						else if (isWhitespace(c)) parser.state = S.PROC_INST_BODY;
						else parser.procInstName += c;
						continue;
					case S.PROC_INST_BODY:
						if (!parser.procInstBody && isWhitespace(c)) continue;
						else if (c === "?") parser.state = S.PROC_INST_ENDING;
						else parser.procInstBody += c;
						continue;
					case S.PROC_INST_ENDING:
						if (c === ">") {
							const procInstEndData = {
								name: parser.procInstName,
								body: parser.procInstBody
							};
							validateXmlDeclarationEncoding(parser, procInstEndData);
							emitNode(parser, "onprocessinginstruction", procInstEndData);
							parser.procInstName = parser.procInstBody = "";
							parser.state = S.TEXT;
						} else {
							parser.procInstBody += "?" + c;
							parser.state = S.PROC_INST_BODY;
						}
						continue;
					case S.OPEN_TAG:
						if (isMatch(nameBody, c)) parser.tagName += c;
						else {
							newTag(parser);
							if (c === ">") openTag(parser);
							else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
							else {
								if (!isWhitespace(c)) strictFail(parser, "Invalid character in tag name");
								parser.state = S.ATTRIB;
							}
						}
						continue;
					case S.OPEN_TAG_SLASH:
						if (c === ">") {
							openTag(parser, true);
							closeTag(parser);
						} else {
							strictFail(parser, "Forward-slash in opening tag not followed by >");
							parser.state = S.ATTRIB;
						}
						continue;
					case S.ATTRIB:
						if (isWhitespace(c)) continue;
						else if (c === ">") openTag(parser);
						else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
						else if (isMatch(nameStart, c)) {
							parser.attribName = c;
							parser.attribValue = "";
							parser.state = S.ATTRIB_NAME;
						} else strictFail(parser, "Invalid attribute name");
						continue;
					case S.ATTRIB_NAME:
						if (c === "=") parser.state = S.ATTRIB_VALUE;
						else if (c === ">") {
							strictFail(parser, "Attribute without value");
							parser.attribValue = parser.attribName;
							attrib(parser);
							openTag(parser);
						} else if (isWhitespace(c)) parser.state = S.ATTRIB_NAME_SAW_WHITE;
						else if (isMatch(nameBody, c)) parser.attribName += c;
						else strictFail(parser, "Invalid attribute name");
						continue;
					case S.ATTRIB_NAME_SAW_WHITE:
						if (c === "=") parser.state = S.ATTRIB_VALUE;
						else if (isWhitespace(c)) continue;
						else {
							strictFail(parser, "Attribute without value");
							parser.tag.attributes[parser.attribName] = "";
							parser.attribValue = "";
							emitNode(parser, "onattribute", {
								name: parser.attribName,
								value: ""
							});
							parser.attribName = "";
							if (c === ">") openTag(parser);
							else if (isMatch(nameStart, c)) {
								parser.attribName = c;
								parser.state = S.ATTRIB_NAME;
							} else {
								strictFail(parser, "Invalid attribute name");
								parser.state = S.ATTRIB;
							}
						}
						continue;
					case S.ATTRIB_VALUE:
						if (isWhitespace(c)) continue;
						else if (isQuote(c)) {
							parser.q = c;
							parser.state = S.ATTRIB_VALUE_QUOTED;
						} else {
							if (!parser.opt.unquotedAttributeValues) error(parser, "Unquoted attribute value");
							parser.state = S.ATTRIB_VALUE_UNQUOTED;
							parser.attribValue = c;
						}
						continue;
					case S.ATTRIB_VALUE_QUOTED:
						if (c !== parser.q) {
							if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q;
							else parser.attribValue += c;
							continue;
						}
						attrib(parser);
						parser.q = "";
						parser.state = S.ATTRIB_VALUE_CLOSED;
						continue;
					case S.ATTRIB_VALUE_CLOSED:
						if (isWhitespace(c)) parser.state = S.ATTRIB;
						else if (c === ">") openTag(parser);
						else if (c === "/") parser.state = S.OPEN_TAG_SLASH;
						else if (isMatch(nameStart, c)) {
							strictFail(parser, "No whitespace between attributes");
							parser.attribName = c;
							parser.attribValue = "";
							parser.state = S.ATTRIB_NAME;
						} else strictFail(parser, "Invalid attribute name");
						continue;
					case S.ATTRIB_VALUE_UNQUOTED:
						if (!isAttribEnd(c)) {
							if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U;
							else parser.attribValue += c;
							continue;
						}
						attrib(parser);
						if (c === ">") openTag(parser);
						else parser.state = S.ATTRIB;
						continue;
					case S.CLOSE_TAG:
						if (!parser.tagName) {
							if (isWhitespace(c)) continue;
							else if (notMatch(nameStart, c)) {
								if (parser.script) {
									parser.script += "</" + c;
									parser.state = S.SCRIPT;
								} else strictFail(parser, "Invalid tagname in closing tag.");
							} else parser.tagName = c;
						} else if (c === ">") closeTag(parser);
						else if (isMatch(nameBody, c)) parser.tagName += c;
						else if (parser.script) {
							parser.script += "</" + parser.tagName + c;
							parser.tagName = "";
							parser.state = S.SCRIPT;
						} else {
							if (!isWhitespace(c)) strictFail(parser, "Invalid tagname in closing tag");
							parser.state = S.CLOSE_TAG_SAW_WHITE;
						}
						continue;
					case S.CLOSE_TAG_SAW_WHITE:
						if (isWhitespace(c)) continue;
						if (c === ">") closeTag(parser);
						else strictFail(parser, "Invalid characters in closing tag");
						continue;
					case S.TEXT_ENTITY:
					case S.ATTRIB_VALUE_ENTITY_Q:
					case S.ATTRIB_VALUE_ENTITY_U:
						var returnState;
						var buffer;
						switch (parser.state) {
							case S.TEXT_ENTITY:
								returnState = S.TEXT;
								buffer = "textNode";
								break;
							case S.ATTRIB_VALUE_ENTITY_Q:
								returnState = S.ATTRIB_VALUE_QUOTED;
								buffer = "attribValue";
								break;
							case S.ATTRIB_VALUE_ENTITY_U:
								returnState = S.ATTRIB_VALUE_UNQUOTED;
								buffer = "attribValue";
						}
						if (c === ";") {
							var parsedEntity = parseEntity(parser);
							if (parser.opt.unparsedEntities && !Object.values(sax.XML_ENTITIES).includes(parsedEntity)) {
								if ((parser.entityCount += 1) > parser.opt.maxEntityCount) error(parser, "Parsed entity count exceeds max entity count");
								if ((parser.entityDepth += 1) > parser.opt.maxEntityDepth) error(parser, "Parsed entity depth exceeds max entity depth");
								parser.entity = "";
								parser.state = returnState;
								parser.write(parsedEntity);
								parser.entityDepth -= 1;
							} else {
								parser[buffer] += parsedEntity;
								parser.entity = "";
								parser.state = returnState;
							}
						} else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) parser.entity += c;
						else {
							strictFail(parser, "Invalid character in entity name");
							parser[buffer] += "&" + parser.entity + c;
							parser.entity = "";
							parser.state = returnState;
						}
						continue;
					default: throw new Error(parser, "Unknown state: " + parser.state);
				}
			}
			if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser);
			return parser;
		}
		/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
		/* istanbul ignore next */
		if (!String.fromCodePoint) (function() {
			var stringFromCharCode = String.fromCharCode;
			var floor = Math.floor;
			var fromCodePoint = function() {
				var MAX_SIZE = 16384;
				var codeUnits = [];
				var highSurrogate;
				var lowSurrogate;
				var index = -1;
				var length = arguments.length;
				if (!length) return "";
				var result = "";
				while (++index < length) {
					var codePoint = Number(arguments[index]);
					if (!isFinite(codePoint) || codePoint < 0 || codePoint > 1114111 || floor(codePoint) !== codePoint) throw RangeError("Invalid code point: " + codePoint);
					if (codePoint <= 65535) codeUnits.push(codePoint);
					else {
						codePoint -= 65536;
						highSurrogate = (codePoint >> 10) + 55296;
						lowSurrogate = codePoint % 1024 + 56320;
						codeUnits.push(highSurrogate, lowSurrogate);
					}
					if (index + 1 === length || codeUnits.length > MAX_SIZE) {
						result += stringFromCharCode.apply(null, codeUnits);
						codeUnits.length = 0;
					}
				}
				return result;
			};
			/* istanbul ignore next */
			if (Object.defineProperty) Object.defineProperty(String, "fromCodePoint", {
				value: fromCodePoint,
				configurable: true,
				writable: true
			});
			else String.fromCodePoint = fromCodePoint;
		})();
	})(typeof exports === "undefined" ? exports.sax = {} : exports);
}));
//#endregion
//#region node_modules/builder-util-runtime/out/xml.js
var require_xml = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.XElement = void 0;
	exports.parseXml = parseXml;
	var sax = require_sax();
	var error_1 = require_error();
	var XElement = class {
		constructor(name) {
			this.name = name;
			this.value = "";
			this.attributes = null;
			this.isCData = false;
			this.elements = null;
			if (!name) throw (0, error_1.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
			if (!isValidName(name)) throw (0, error_1.newError)(`Invalid element name: ${name}`, "ERR_XML_ELEMENT_INVALID_NAME");
		}
		attribute(name) {
			const result = this.attributes === null ? null : this.attributes[name];
			if (result == null) throw (0, error_1.newError)(`No attribute "${name}"`, "ERR_XML_MISSED_ATTRIBUTE");
			return result;
		}
		removeAttribute(name) {
			if (this.attributes !== null) delete this.attributes[name];
		}
		element(name, ignoreCase = false, errorIfMissed = null) {
			const result = this.elementOrNull(name, ignoreCase);
			if (result === null) throw (0, error_1.newError)(errorIfMissed || `No element "${name}"`, "ERR_XML_MISSED_ELEMENT");
			return result;
		}
		elementOrNull(name, ignoreCase = false) {
			if (this.elements === null) return null;
			for (const element of this.elements) if (isNameEquals(element, name, ignoreCase)) return element;
			return null;
		}
		getElements(name, ignoreCase = false) {
			if (this.elements === null) return [];
			return this.elements.filter((it) => isNameEquals(it, name, ignoreCase));
		}
		elementValueOrEmpty(name, ignoreCase = false) {
			const element = this.elementOrNull(name, ignoreCase);
			return element === null ? "" : element.value;
		}
	};
	exports.XElement = XElement;
	var NAME_REG_EXP = /* @__PURE__ */ new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
	function isValidName(name) {
		return NAME_REG_EXP.test(name);
	}
	function isNameEquals(element, name, ignoreCase) {
		const elementName = element.name;
		return elementName === name || ignoreCase === true && elementName.length === name.length && elementName.toLowerCase() === name.toLowerCase();
	}
	function parseXml(data) {
		let rootElement = null;
		const parser = sax.parser(true, {});
		const elements = [];
		parser.onopentag = (saxElement) => {
			const element = new XElement(saxElement.name);
			element.attributes = saxElement.attributes;
			if (rootElement === null) rootElement = element;
			else {
				const parent = elements[elements.length - 1];
				if (parent.elements == null) parent.elements = [];
				parent.elements.push(element);
			}
			elements.push(element);
		};
		parser.onclosetag = () => {
			elements.pop();
		};
		parser.ontext = (text) => {
			if (elements.length > 0) elements[elements.length - 1].value = text;
		};
		parser.oncdata = (cdata) => {
			const element = elements[elements.length - 1];
			element.value = cdata;
			element.isCData = true;
		};
		parser.onerror = (err) => {
			throw err;
		};
		parser.write(data);
		return rootElement;
	}
}));
//#endregion
//#region node_modules/builder-util-runtime/out/objects.js
var require_objects = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.mapToObject = mapToObject;
	exports.isValidKey = isValidKey;
	exports.asArray = asArray;
	exports.deepAssign = deepAssign;
	exports.objectToArgs = objectToArgs;
	function mapToObject(map) {
		const obj = {};
		for (const [key, value] of map) {
			if (!isValidKey(key)) continue;
			if (value instanceof Map) obj[key] = mapToObject(value);
			else obj[key] = value;
		}
		return obj;
	}
	function isValidKey(key) {
		if ([
			"__proto__",
			"prototype",
			"constructor"
		].includes(key)) return false;
		return [
			"string",
			"number",
			"symbol",
			"boolean"
		].includes(typeof key) || key === null;
	}
	function asArray(v) {
		if (v == null) return [];
		else if (Array.isArray(v)) return v;
		else return [v];
	}
	function isObject(x) {
		if (Array.isArray(x)) return false;
		const type = typeof x;
		return type === "object" || type === "function";
	}
	function assignKey(target, from, key) {
		const value = from[key];
		if (value === void 0) return;
		const prevValue = target[key];
		if (prevValue == null || value == null || !isObject(prevValue) || !isObject(value)) {
			if (Array.isArray(prevValue) && Array.isArray(value)) target[key] = Array.from(new Set(prevValue.concat(value)));
			else target[key] = value;
		} else target[key] = assign(prevValue, value);
	}
	function assign(to, from) {
		if (to !== from) {
			for (const key of Object.getOwnPropertyNames(from)) if (isValidKey(key)) assignKey(to, from, key);
		}
		return to;
	}
	function deepAssign(target, ...objects) {
		for (const o of objects) if (o != null) assign(target, o);
		return target;
	}
	var SAFE_FLAG_NAME_RE = /^[a-zA-Z][a-zA-Z0-9-]*$/;
	var UNSAFE_VALUE_RE = /[\0\r\n]/;
	function objectToArgs(obj) {
		const args = Object.entries(obj).reduce((args, [name, value]) => {
			if (!isValidKey(name) || value == null) return args;
			if (!SAFE_FLAG_NAME_RE.test(name)) throw new Error(`objectToArgs: unsafe flag name rejected: ${JSON.stringify(name)}`);
			if (UNSAFE_VALUE_RE.test(value)) throw new Error(`objectToArgs: value for --${name} contains a null byte or newline`);
			return args.concat([`--${name}`, value]);
		}, []);
		return Object.freeze(args);
	}
}));
//#endregion
//#region node_modules/builder-util-runtime/out/index.js
var require_out = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CURRENT_APP_PACKAGE_FILE_NAME = exports.CURRENT_APP_INSTALLER_FILE_NAME = exports.objectToArgs = exports.deepAssign = exports.asArray = exports.mapToObject = exports.isValidKey = exports.XElement = exports.parseXml = exports.UUID = exports.parseDn = exports.retry = exports.githubTagPrefix = exports.githubUrl = exports.getS3LikeProviderBaseUrl = exports.ProgressCallbackTransform = exports.MemoLazy = exports.safeStringifyJson = exports.safeGetHeader = exports.parseJson = exports.isSensitiveFieldName = exports.HttpExecutor = exports.hashSensitiveValue = exports.HttpError = exports.DigestTransform = exports.createHttpError = exports.configureRequestUrl = exports.configureRequestOptionsFromUrl = exports.configureRequestOptions = exports.newError = exports.CancellationToken = exports.CancellationError = void 0;
	var CancellationToken_1 = require_CancellationToken();
	Object.defineProperty(exports, "CancellationError", {
		enumerable: true,
		get: function() {
			return CancellationToken_1.CancellationError;
		}
	});
	Object.defineProperty(exports, "CancellationToken", {
		enumerable: true,
		get: function() {
			return CancellationToken_1.CancellationToken;
		}
	});
	var error_1 = require_error();
	Object.defineProperty(exports, "newError", {
		enumerable: true,
		get: function() {
			return error_1.newError;
		}
	});
	var httpExecutor_1 = require_httpExecutor();
	Object.defineProperty(exports, "configureRequestOptions", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.configureRequestOptions;
		}
	});
	Object.defineProperty(exports, "configureRequestOptionsFromUrl", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.configureRequestOptionsFromUrl;
		}
	});
	Object.defineProperty(exports, "configureRequestUrl", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.configureRequestUrl;
		}
	});
	Object.defineProperty(exports, "createHttpError", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.createHttpError;
		}
	});
	Object.defineProperty(exports, "DigestTransform", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.DigestTransform;
		}
	});
	Object.defineProperty(exports, "HttpError", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.HttpError;
		}
	});
	Object.defineProperty(exports, "hashSensitiveValue", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.hashSensitiveValue;
		}
	});
	Object.defineProperty(exports, "HttpExecutor", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.HttpExecutor;
		}
	});
	Object.defineProperty(exports, "isSensitiveFieldName", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.isSensitiveFieldName;
		}
	});
	Object.defineProperty(exports, "parseJson", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.parseJson;
		}
	});
	Object.defineProperty(exports, "safeGetHeader", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.safeGetHeader;
		}
	});
	Object.defineProperty(exports, "safeStringifyJson", {
		enumerable: true,
		get: function() {
			return httpExecutor_1.safeStringifyJson;
		}
	});
	var MemoLazy_1 = require_MemoLazy();
	Object.defineProperty(exports, "MemoLazy", {
		enumerable: true,
		get: function() {
			return MemoLazy_1.MemoLazy;
		}
	});
	var ProgressCallbackTransform_1 = require_ProgressCallbackTransform();
	Object.defineProperty(exports, "ProgressCallbackTransform", {
		enumerable: true,
		get: function() {
			return ProgressCallbackTransform_1.ProgressCallbackTransform;
		}
	});
	var publishOptions_1 = require_publishOptions();
	Object.defineProperty(exports, "getS3LikeProviderBaseUrl", {
		enumerable: true,
		get: function() {
			return publishOptions_1.getS3LikeProviderBaseUrl;
		}
	});
	Object.defineProperty(exports, "githubUrl", {
		enumerable: true,
		get: function() {
			return publishOptions_1.githubUrl;
		}
	});
	Object.defineProperty(exports, "githubTagPrefix", {
		enumerable: true,
		get: function() {
			return publishOptions_1.githubTagPrefix;
		}
	});
	var retry_1 = require_retry();
	Object.defineProperty(exports, "retry", {
		enumerable: true,
		get: function() {
			return retry_1.retry;
		}
	});
	var rfc2253Parser_1 = require_rfc2253Parser();
	Object.defineProperty(exports, "parseDn", {
		enumerable: true,
		get: function() {
			return rfc2253Parser_1.parseDn;
		}
	});
	var uuid_1 = require_uuid();
	Object.defineProperty(exports, "UUID", {
		enumerable: true,
		get: function() {
			return uuid_1.UUID;
		}
	});
	var xml_1 = require_xml();
	Object.defineProperty(exports, "parseXml", {
		enumerable: true,
		get: function() {
			return xml_1.parseXml;
		}
	});
	Object.defineProperty(exports, "XElement", {
		enumerable: true,
		get: function() {
			return xml_1.XElement;
		}
	});
	var objects_1 = require_objects();
	Object.defineProperty(exports, "isValidKey", {
		enumerable: true,
		get: function() {
			return objects_1.isValidKey;
		}
	});
	Object.defineProperty(exports, "mapToObject", {
		enumerable: true,
		get: function() {
			return objects_1.mapToObject;
		}
	});
	Object.defineProperty(exports, "asArray", {
		enumerable: true,
		get: function() {
			return objects_1.asArray;
		}
	});
	Object.defineProperty(exports, "deepAssign", {
		enumerable: true,
		get: function() {
			return objects_1.deepAssign;
		}
	});
	Object.defineProperty(exports, "objectToArgs", {
		enumerable: true,
		get: function() {
			return objects_1.objectToArgs;
		}
	});
	exports.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe";
	exports.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
}));
//#endregion
//#region node_modules/js-yaml/lib/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function isNothing(subject) {
		return typeof subject === "undefined" || subject === null;
	}
	function isObject(subject) {
		return typeof subject === "object" && subject !== null;
	}
	function toArray(sequence) {
		if (Array.isArray(sequence)) return sequence;
		else if (isNothing(sequence)) return [];
		return [sequence];
	}
	function extend(target, source) {
		if (source) {
			const sourceKeys = Object.keys(source);
			for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
				const key = sourceKeys[index];
				target[key] = source[key];
			}
		}
		return target;
	}
	function repeat(string, count) {
		let result = "";
		for (let cycle = 0; cycle < count; cycle += 1) result += string;
		return result;
	}
	function isNegativeZero(number) {
		return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
	}
	module.exports.isNothing = isNothing;
	module.exports.isObject = isObject;
	module.exports.toArray = toArray;
	module.exports.repeat = repeat;
	module.exports.isNegativeZero = isNegativeZero;
	module.exports.extend = extend;
}));
//#endregion
//#region node_modules/js-yaml/lib/exception.js
var require_exception = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function formatError(exception, compact) {
		let where = "";
		const message = exception.reason || "(unknown reason)";
		if (!exception.mark) return message;
		if (exception.mark.name) where += "in \"" + exception.mark.name + "\" ";
		where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
		if (!compact && exception.mark.snippet) where += "\n\n" + exception.mark.snippet;
		return message + " " + where;
	}
	function YAMLException(reason, mark) {
		Error.call(this);
		this.name = "YAMLException";
		this.reason = reason;
		this.mark = mark;
		this.message = formatError(this, false);
		if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
		else this.stack = (/* @__PURE__ */ new Error()).stack || "";
	}
	YAMLException.prototype = Object.create(Error.prototype);
	YAMLException.prototype.constructor = YAMLException;
	YAMLException.prototype.toString = function toString(compact) {
		return this.name + ": " + formatError(this, compact);
	};
	module.exports = YAMLException;
}));
//#endregion
//#region node_modules/js-yaml/lib/snippet.js
var require_snippet = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var common = require_common();
	function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
		let head = "";
		let tail = "";
		const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
		if (position - lineStart > maxHalfLength) {
			head = " ... ";
			lineStart = position - maxHalfLength + head.length;
		}
		if (lineEnd - position > maxHalfLength) {
			tail = " ...";
			lineEnd = position + maxHalfLength - tail.length;
		}
		return {
			str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
			pos: position - lineStart + head.length
		};
	}
	function padStart(string, max) {
		return common.repeat(" ", max - string.length) + string;
	}
	function makeSnippet(mark, options) {
		options = Object.create(options || null);
		if (!mark.buffer) return null;
		if (!options.maxLength) options.maxLength = 79;
		if (typeof options.indent !== "number") options.indent = 1;
		if (typeof options.linesBefore !== "number") options.linesBefore = 3;
		if (typeof options.linesAfter !== "number") options.linesAfter = 2;
		const re = /\r?\n|\r|\0/g;
		const lineStarts = [0];
		const lineEnds = [];
		let match;
		let foundLineNo = -1;
		while (match = re.exec(mark.buffer)) {
			lineEnds.push(match.index);
			lineStarts.push(match.index + match[0].length);
			if (mark.position <= match.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
		}
		if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
		let result = "";
		const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
		const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
		for (let i = 1; i <= options.linesBefore; i++) {
			if (foundLineNo - i < 0) break;
			const line = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
			result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
		}
		const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
		result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
		result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
		for (let i = 1; i <= options.linesAfter; i++) {
			if (foundLineNo + i >= lineEnds.length) break;
			const line = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
			result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
		}
		return result.replace(/\n$/, "");
	}
	module.exports = makeSnippet;
}));
//#endregion
//#region node_modules/js-yaml/lib/type.js
var require_type = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var YAMLException = require_exception();
	var TYPE_CONSTRUCTOR_OPTIONS = [
		"kind",
		"multi",
		"resolve",
		"construct",
		"instanceOf",
		"predicate",
		"represent",
		"representName",
		"defaultStyle",
		"styleAliases"
	];
	var YAML_NODE_KINDS = [
		"scalar",
		"sequence",
		"mapping"
	];
	function compileStyleAliases(map) {
		const result = {};
		if (map !== null) Object.keys(map).forEach(function(style) {
			map[style].forEach(function(alias) {
				result[String(alias)] = style;
			});
		});
		return result;
	}
	function Type(tag, options) {
		options = options || {};
		Object.keys(options).forEach(function(name) {
			if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) throw new YAMLException("Unknown option \"" + name + "\" is met in definition of \"" + tag + "\" YAML type.");
		});
		this.options = options;
		this.tag = tag;
		this.kind = options["kind"] || null;
		this.resolve = options["resolve"] || function() {
			return true;
		};
		this.construct = options["construct"] || function(data) {
			return data;
		};
		this.instanceOf = options["instanceOf"] || null;
		this.predicate = options["predicate"] || null;
		this.represent = options["represent"] || null;
		this.representName = options["representName"] || null;
		this.defaultStyle = options["defaultStyle"] || null;
		this.multi = options["multi"] || false;
		this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
		if (YAML_NODE_KINDS.indexOf(this.kind) === -1) throw new YAMLException("Unknown kind \"" + this.kind + "\" is specified for \"" + tag + "\" YAML type.");
	}
	module.exports = Type;
}));
//#endregion
//#region node_modules/js-yaml/lib/schema.js
var require_schema = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var YAMLException = require_exception();
	var Type = require_type();
	function compileList(schema, name) {
		const result = [];
		schema[name].forEach(function(currentType) {
			let newIndex = result.length;
			result.forEach(function(previousType, previousIndex) {
				if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) newIndex = previousIndex;
			});
			result[newIndex] = currentType;
		});
		return result;
	}
	function compileMap() {
		const result = {
			scalar: {},
			sequence: {},
			mapping: {},
			fallback: {},
			multi: {
				scalar: [],
				sequence: [],
				mapping: [],
				fallback: []
			}
		};
		function collectType(type) {
			if (type.multi) {
				result.multi[type.kind].push(type);
				result.multi["fallback"].push(type);
			} else result[type.kind][type.tag] = result["fallback"][type.tag] = type;
		}
		for (let index = 0, length = arguments.length; index < length; index += 1) arguments[index].forEach(collectType);
		return result;
	}
	function Schema(definition) {
		return this.extend(definition);
	}
	Schema.prototype.extend = function extend(definition) {
		let implicit = [];
		let explicit = [];
		if (definition instanceof Type) explicit.push(definition);
		else if (Array.isArray(definition)) explicit = explicit.concat(definition);
		else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
			if (definition.implicit) implicit = implicit.concat(definition.implicit);
			if (definition.explicit) explicit = explicit.concat(definition.explicit);
		} else throw new YAMLException("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
		implicit.forEach(function(type) {
			if (!(type instanceof Type)) throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
			if (type.loadKind && type.loadKind !== "scalar") throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
			if (type.multi) throw new YAMLException("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
		});
		explicit.forEach(function(type) {
			if (!(type instanceof Type)) throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
		});
		const result = Object.create(Schema.prototype);
		result.implicit = (this.implicit || []).concat(implicit);
		result.explicit = (this.explicit || []).concat(explicit);
		result.compiledImplicit = compileList(result, "implicit");
		result.compiledExplicit = compileList(result, "explicit");
		result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
		return result;
	};
	module.exports = Schema;
}));
//#endregion
//#region node_modules/js-yaml/lib/type/str.js
var require_str = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = new (require_type())("tag:yaml.org,2002:str", {
		kind: "scalar",
		construct: function(data) {
			return data !== null ? data : "";
		}
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/seq.js
var require_seq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = new (require_type())("tag:yaml.org,2002:seq", {
		kind: "sequence",
		construct: function(data) {
			return data !== null ? data : [];
		}
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/map.js
var require_map = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = new (require_type())("tag:yaml.org,2002:map", {
		kind: "mapping",
		construct: function(data) {
			return data !== null ? data : {};
		}
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/schema/failsafe.js
var require_failsafe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = new (require_schema())({ explicit: [
		require_str(),
		require_seq(),
		require_map()
	] });
}));
//#endregion
//#region node_modules/js-yaml/lib/type/null.js
var require_null = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	function resolveYamlNull(data) {
		if (data === null) return true;
		const max = data.length;
		return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
	}
	function constructYamlNull() {
		return null;
	}
	function isNull(object) {
		return object === null;
	}
	module.exports = new Type("tag:yaml.org,2002:null", {
		kind: "scalar",
		resolve: resolveYamlNull,
		construct: constructYamlNull,
		predicate: isNull,
		represent: {
			canonical: function() {
				return "~";
			},
			lowercase: function() {
				return "null";
			},
			uppercase: function() {
				return "NULL";
			},
			camelcase: function() {
				return "Null";
			},
			empty: function() {
				return "";
			}
		},
		defaultStyle: "lowercase"
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/bool.js
var require_bool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	function resolveYamlBoolean(data) {
		if (data === null) return false;
		const max = data.length;
		return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
	}
	function constructYamlBoolean(data) {
		return data === "true" || data === "True" || data === "TRUE";
	}
	function isBoolean(object) {
		return Object.prototype.toString.call(object) === "[object Boolean]";
	}
	module.exports = new Type("tag:yaml.org,2002:bool", {
		kind: "scalar",
		resolve: resolveYamlBoolean,
		construct: constructYamlBoolean,
		predicate: isBoolean,
		represent: {
			lowercase: function(object) {
				return object ? "true" : "false";
			},
			uppercase: function(object) {
				return object ? "TRUE" : "FALSE";
			},
			camelcase: function(object) {
				return object ? "True" : "False";
			}
		},
		defaultStyle: "lowercase"
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/int.js
var require_int = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var common = require_common();
	var Type = require_type();
	function isHexCode(c) {
		return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
	}
	function isOctCode(c) {
		return c >= 48 && c <= 55;
	}
	function isDecCode(c) {
		return c >= 48 && c <= 57;
	}
	function resolveYamlInteger(data) {
		if (data === null) return false;
		const max = data.length;
		let index = 0;
		let hasDigits = false;
		if (!max) return false;
		let ch = data[index];
		if (ch === "-" || ch === "+") ch = data[++index];
		if (ch === "0") {
			if (index + 1 === max) return true;
			ch = data[++index];
			if (ch === "b") {
				index++;
				for (; index < max; index++) {
					ch = data[index];
					if (ch !== "0" && ch !== "1") return false;
					hasDigits = true;
				}
				return hasDigits && isFinite(parseYamlInteger(data));
			}
			if (ch === "x") {
				index++;
				for (; index < max; index++) {
					if (!isHexCode(data.charCodeAt(index))) return false;
					hasDigits = true;
				}
				return hasDigits && isFinite(parseYamlInteger(data));
			}
			if (ch === "o") {
				index++;
				for (; index < max; index++) {
					if (!isOctCode(data.charCodeAt(index))) return false;
					hasDigits = true;
				}
				return hasDigits && isFinite(parseYamlInteger(data));
			}
		}
		for (; index < max; index++) {
			if (!isDecCode(data.charCodeAt(index))) return false;
			hasDigits = true;
		}
		if (!hasDigits) return false;
		return isFinite(parseYamlInteger(data));
	}
	function parseYamlInteger(data) {
		let value = data;
		let sign = 1;
		let ch = value[0];
		if (ch === "-" || ch === "+") {
			if (ch === "-") sign = -1;
			value = value.slice(1);
			ch = value[0];
		}
		if (value === "0") return 0;
		if (ch === "0") {
			if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
			if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
			if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
		}
		return sign * parseInt(value, 10);
	}
	function constructYamlInteger(data) {
		return parseYamlInteger(data);
	}
	function isInteger(object) {
		return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !common.isNegativeZero(object);
	}
	module.exports = new Type("tag:yaml.org,2002:int", {
		kind: "scalar",
		resolve: resolveYamlInteger,
		construct: constructYamlInteger,
		predicate: isInteger,
		represent: {
			binary: function(obj) {
				return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
			},
			octal: function(obj) {
				return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
			},
			decimal: function(obj) {
				return obj.toString(10);
			},
			hexadecimal: function(obj) {
				return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
			}
		},
		defaultStyle: "decimal",
		styleAliases: {
			binary: [2, "bin"],
			octal: [8, "oct"],
			decimal: [10, "dec"],
			hexadecimal: [16, "hex"]
		}
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/float.js
var require_float = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var common = require_common();
	var Type = require_type();
	var YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
	var YAML_FLOAT_SPECIAL_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
	function resolveYamlFloat(data) {
		if (data === null) return false;
		if (!YAML_FLOAT_PATTERN.test(data)) return false;
		if (isFinite(parseFloat(data, 10))) return true;
		return YAML_FLOAT_SPECIAL_PATTERN.test(data);
	}
	function constructYamlFloat(data) {
		let value = data.toLowerCase();
		const sign = value[0] === "-" ? -1 : 1;
		if ("+-".indexOf(value[0]) >= 0) value = value.slice(1);
		if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
		else if (value === ".nan") return NaN;
		return sign * parseFloat(value, 10);
	}
	var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
	function representYamlFloat(object, style) {
		if (isNaN(object)) switch (style) {
			case "lowercase": return ".nan";
			case "uppercase": return ".NAN";
			case "camelcase": return ".NaN";
		}
		else if (Number.POSITIVE_INFINITY === object) switch (style) {
			case "lowercase": return ".inf";
			case "uppercase": return ".INF";
			case "camelcase": return ".Inf";
		}
		else if (Number.NEGATIVE_INFINITY === object) switch (style) {
			case "lowercase": return "-.inf";
			case "uppercase": return "-.INF";
			case "camelcase": return "-.Inf";
		}
		else if (common.isNegativeZero(object)) return "-0.0";
		const res = object.toString(10);
		return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
	}
	function isFloat(object) {
		return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
	}
	module.exports = new Type("tag:yaml.org,2002:float", {
		kind: "scalar",
		resolve: resolveYamlFloat,
		construct: constructYamlFloat,
		predicate: isFloat,
		represent: representYamlFloat,
		defaultStyle: "lowercase"
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/schema/json.js
var require_json = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_failsafe().extend({ implicit: [
		require_null(),
		require_bool(),
		require_int(),
		require_float()
	] });
}));
//#endregion
//#region node_modules/js-yaml/lib/schema/core.js
var require_core = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_json();
}));
//#endregion
//#region node_modules/js-yaml/lib/type/timestamp.js
var require_timestamp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	var YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
	var YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
	function resolveYamlTimestamp(data) {
		if (data === null) return false;
		if (YAML_DATE_REGEXP.exec(data) !== null) return true;
		if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
		return false;
	}
	function constructYamlTimestamp(data) {
		let fraction = 0;
		let delta = null;
		let match = YAML_DATE_REGEXP.exec(data);
		if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
		if (match === null) throw new Error("Date resolve error");
		const year = +match[1];
		const month = +match[2] - 1;
		const day = +match[3];
		if (!match[4]) return new Date(Date.UTC(year, month, day));
		const hour = +match[4];
		const minute = +match[5];
		const second = +match[6];
		if (match[7]) {
			fraction = match[7].slice(0, 3);
			while (fraction.length < 3) fraction += "0";
			fraction = +fraction;
		}
		if (match[9]) {
			const tzHour = +match[10];
			const tzMinute = +(match[11] || 0);
			delta = (tzHour * 60 + tzMinute) * 6e4;
			if (match[9] === "-") delta = -delta;
		}
		const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
		if (delta) date.setTime(date.getTime() - delta);
		return date;
	}
	function representYamlTimestamp(object) {
		return object.toISOString();
	}
	module.exports = new Type("tag:yaml.org,2002:timestamp", {
		kind: "scalar",
		resolve: resolveYamlTimestamp,
		construct: constructYamlTimestamp,
		instanceOf: Date,
		represent: representYamlTimestamp
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/merge.js
var require_merge = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	function resolveYamlMerge(data) {
		return data === "<<" || data === null;
	}
	module.exports = new Type("tag:yaml.org,2002:merge", {
		kind: "scalar",
		resolve: resolveYamlMerge
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/binary.js
var require_binary = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
	function resolveYamlBinary(data) {
		if (data === null) return false;
		let bitlen = 0;
		const max = data.length;
		const map = BASE64_MAP;
		for (let idx = 0; idx < max; idx++) {
			const code = map.indexOf(data.charAt(idx));
			if (code > 64) continue;
			if (code < 0) return false;
			bitlen += 6;
		}
		return bitlen % 8 === 0;
	}
	function constructYamlBinary(data) {
		const input = data.replace(/[\r\n=]/g, "");
		const max = input.length;
		const map = BASE64_MAP;
		let bits = 0;
		const result = [];
		for (let idx = 0; idx < max; idx++) {
			if (idx % 4 === 0 && idx) {
				result.push(bits >> 16 & 255);
				result.push(bits >> 8 & 255);
				result.push(bits & 255);
			}
			bits = bits << 6 | map.indexOf(input.charAt(idx));
		}
		const tailbits = max % 4 * 6;
		if (tailbits === 0) {
			result.push(bits >> 16 & 255);
			result.push(bits >> 8 & 255);
			result.push(bits & 255);
		} else if (tailbits === 18) {
			result.push(bits >> 10 & 255);
			result.push(bits >> 2 & 255);
		} else if (tailbits === 12) result.push(bits >> 4 & 255);
		return new Uint8Array(result);
	}
	function representYamlBinary(object) {
		let result = "";
		let bits = 0;
		const max = object.length;
		const map = BASE64_MAP;
		for (let idx = 0; idx < max; idx++) {
			if (idx % 3 === 0 && idx) {
				result += map[bits >> 18 & 63];
				result += map[bits >> 12 & 63];
				result += map[bits >> 6 & 63];
				result += map[bits & 63];
			}
			bits = (bits << 8) + object[idx];
		}
		const tail = max % 3;
		if (tail === 0) {
			result += map[bits >> 18 & 63];
			result += map[bits >> 12 & 63];
			result += map[bits >> 6 & 63];
			result += map[bits & 63];
		} else if (tail === 2) {
			result += map[bits >> 10 & 63];
			result += map[bits >> 4 & 63];
			result += map[bits << 2 & 63];
			result += map[64];
		} else if (tail === 1) {
			result += map[bits >> 2 & 63];
			result += map[bits << 4 & 63];
			result += map[64];
			result += map[64];
		}
		return result;
	}
	function isBinary(obj) {
		return Object.prototype.toString.call(obj) === "[object Uint8Array]";
	}
	module.exports = new Type("tag:yaml.org,2002:binary", {
		kind: "scalar",
		resolve: resolveYamlBinary,
		construct: constructYamlBinary,
		predicate: isBinary,
		represent: representYamlBinary
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/omap.js
var require_omap = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	var _hasOwnProperty = Object.prototype.hasOwnProperty;
	var _toString = Object.prototype.toString;
	function resolveYamlOmap(data) {
		if (data === null) return true;
		const objectKeys = {};
		const object = data;
		for (let index = 0, length = object.length; index < length; index += 1) {
			const pair = object[index];
			let pairHasKey = false;
			if (_toString.call(pair) !== "[object Object]") return false;
			let pairKey;
			for (pairKey in pair) if (_hasOwnProperty.call(pair, pairKey)) {
				if (!pairHasKey) pairHasKey = true;
				else return false;
			}
			if (!pairHasKey) return false;
			if (_hasOwnProperty.call(objectKeys, pairKey)) return false;
			Object.defineProperty(objectKeys, pairKey, { value: true });
		}
		return true;
	}
	function constructYamlOmap(data) {
		return data !== null ? data : [];
	}
	module.exports = new Type("tag:yaml.org,2002:omap", {
		kind: "sequence",
		resolve: resolveYamlOmap,
		construct: constructYamlOmap
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/pairs.js
var require_pairs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	var _toString = Object.prototype.toString;
	function resolveYamlPairs(data) {
		if (data === null) return true;
		const object = data;
		const result = new Array(object.length);
		for (let index = 0, length = object.length; index < length; index += 1) {
			const pair = object[index];
			if (_toString.call(pair) !== "[object Object]") return false;
			const keys = Object.keys(pair);
			if (keys.length !== 1) return false;
			result[index] = [keys[0], pair[keys[0]]];
		}
		return true;
	}
	function constructYamlPairs(data) {
		if (data === null) return [];
		const object = data;
		const result = new Array(object.length);
		for (let index = 0, length = object.length; index < length; index += 1) {
			const pair = object[index];
			const keys = Object.keys(pair);
			result[index] = [keys[0], pair[keys[0]]];
		}
		return result;
	}
	module.exports = new Type("tag:yaml.org,2002:pairs", {
		kind: "sequence",
		resolve: resolveYamlPairs,
		construct: constructYamlPairs
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/type/set.js
var require_set = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Type = require_type();
	var _hasOwnProperty = Object.prototype.hasOwnProperty;
	function resolveYamlSet(data) {
		if (data === null) return true;
		const object = data;
		for (const key in object) if (_hasOwnProperty.call(object, key)) {
			if (object[key] !== null) return false;
		}
		return true;
	}
	function constructYamlSet(data) {
		return data !== null ? data : {};
	}
	module.exports = new Type("tag:yaml.org,2002:set", {
		kind: "mapping",
		resolve: resolveYamlSet,
		construct: constructYamlSet
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/schema/default.js
var require_default = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_core().extend({
		implicit: [require_timestamp(), require_merge()],
		explicit: [
			require_binary(),
			require_omap(),
			require_pairs(),
			require_set()
		]
	});
}));
//#endregion
//#region node_modules/js-yaml/lib/loader.js
var require_loader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var common = require_common();
	var YAMLException = require_exception();
	var makeSnippet = require_snippet();
	var DEFAULT_SCHEMA = require_default();
	var _hasOwnProperty = Object.prototype.hasOwnProperty;
	var CONTEXT_FLOW_IN = 1;
	var CONTEXT_FLOW_OUT = 2;
	var CONTEXT_BLOCK_IN = 3;
	var CONTEXT_BLOCK_OUT = 4;
	var CHOMPING_CLIP = 1;
	var CHOMPING_STRIP = 2;
	var CHOMPING_KEEP = 3;
	var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
	var PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
	var PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
	var PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
	function _class(obj) {
		return Object.prototype.toString.call(obj);
	}
	function isEol(c) {
		return c === 10 || c === 13;
	}
	function isWhiteSpace(c) {
		return c === 9 || c === 32;
	}
	function isWsOrEol(c) {
		return c === 9 || c === 32 || c === 10 || c === 13;
	}
	function isFlowIndicator(c) {
		return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
	}
	function fromHexCode(c) {
		if (c >= 48 && c <= 57) return c - 48;
		const lc = c | 32;
		if (lc >= 97 && lc <= 102) return lc - 97 + 10;
		return -1;
	}
	function escapedHexLen(c) {
		if (c === 120) return 2;
		if (c === 117) return 4;
		if (c === 85) return 8;
		return 0;
	}
	function fromDecimalCode(c) {
		if (c >= 48 && c <= 57) return c - 48;
		return -1;
	}
	function simpleEscapeSequence(c) {
		switch (c) {
			case 48: return "\0";
			case 97: return "\x07";
			case 98: return "\b";
			case 116: return "	";
			case 9: return "	";
			case 110: return "\n";
			case 118: return "\v";
			case 102: return "\f";
			case 114: return "\r";
			case 101: return "\x1B";
			case 32: return " ";
			case 34: return "\"";
			case 47: return "/";
			case 92: return "\\";
			case 78: return "";
			case 95: return "\xA0";
			case 76: return "\u2028";
			case 80: return "\u2029";
			default: return "";
		}
	}
	function charFromCodepoint(c) {
		if (c <= 65535) return String.fromCharCode(c);
		return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
	}
	function setProperty(object, key, value) {
		if (key === "__proto__") Object.defineProperty(object, key, {
			configurable: true,
			enumerable: true,
			writable: true,
			value
		});
		else object[key] = value;
	}
	var simpleEscapeCheck = new Array(256);
	var simpleEscapeMap = new Array(256);
	for (let i = 0; i < 256; i++) {
		simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
		simpleEscapeMap[i] = simpleEscapeSequence(i);
	}
	function State(input, options) {
		this.input = input;
		this.filename = options["filename"] || null;
		this.schema = options["schema"] || DEFAULT_SCHEMA;
		this.onWarning = options["onWarning"] || null;
		this.legacy = options["legacy"] || false;
		this.json = options["json"] || false;
		this.listener = options["listener"] || null;
		this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
		this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
		this.implicitTypes = this.schema.compiledImplicit;
		this.typeMap = this.schema.compiledTypeMap;
		this.length = input.length;
		this.position = 0;
		this.line = 0;
		this.lineStart = 0;
		this.lineIndent = 0;
		this.depth = 0;
		this.totalMergeKeys = 0;
		this.firstTabInLine = -1;
		this.documents = [];
		this.anchorMapTransactions = [];
	}
	function generateError(state, message) {
		const mark = {
			name: state.filename,
			buffer: state.input.slice(0, -1),
			position: state.position,
			line: state.line,
			column: state.position - state.lineStart
		};
		mark.snippet = makeSnippet(mark);
		return new YAMLException(message, mark);
	}
	function throwError(state, message) {
		throw generateError(state, message);
	}
	function throwWarning(state, message) {
		if (state.onWarning) state.onWarning.call(null, generateError(state, message));
	}
	function storeAnchor(state, name, value) {
		const transactions = state.anchorMapTransactions;
		if (transactions.length !== 0) {
			const transaction = transactions[transactions.length - 1];
			if (!_hasOwnProperty.call(transaction, name)) transaction[name] = {
				existed: _hasOwnProperty.call(state.anchorMap, name),
				value: state.anchorMap[name]
			};
		}
		state.anchorMap[name] = value;
	}
	function beginAnchorTransaction(state) {
		state.anchorMapTransactions.push(Object.create(null));
	}
	function commitAnchorTransaction(state) {
		const transaction = state.anchorMapTransactions.pop();
		const transactions = state.anchorMapTransactions;
		if (transactions.length === 0) return;
		const parent = transactions[transactions.length - 1];
		const names = Object.keys(transaction);
		for (let index = 0, length = names.length; index < length; index += 1) {
			const name = names[index];
			if (!_hasOwnProperty.call(parent, name)) parent[name] = transaction[name];
		}
	}
	function rollbackAnchorTransaction(state) {
		const transaction = state.anchorMapTransactions.pop();
		const names = Object.keys(transaction);
		for (let index = names.length - 1; index >= 0; index -= 1) {
			const entry = transaction[names[index]];
			if (entry.existed) state.anchorMap[names[index]] = entry.value;
			else delete state.anchorMap[names[index]];
		}
	}
	function snapshotState(state) {
		return {
			position: state.position,
			line: state.line,
			lineStart: state.lineStart,
			lineIndent: state.lineIndent,
			firstTabInLine: state.firstTabInLine,
			tag: state.tag,
			anchor: state.anchor,
			kind: state.kind,
			result: state.result
		};
	}
	function restoreState(state, snapshot) {
		state.position = snapshot.position;
		state.line = snapshot.line;
		state.lineStart = snapshot.lineStart;
		state.lineIndent = snapshot.lineIndent;
		state.firstTabInLine = snapshot.firstTabInLine;
		state.tag = snapshot.tag;
		state.anchor = snapshot.anchor;
		state.kind = snapshot.kind;
		state.result = snapshot.result;
	}
	var directiveHandlers = {
		YAML: function handleYamlDirective(state, name, args) {
			if (state.version !== null) throwError(state, "duplication of %YAML directive");
			if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
			const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
			if (match === null) throwError(state, "ill-formed argument of the YAML directive");
			const major = parseInt(match[1], 10);
			const minor = parseInt(match[2], 10);
			if (major !== 1) throwError(state, "unacceptable YAML version of the document");
			state.version = args[0];
			state.checkLineBreaks = minor < 2;
			if (minor !== 1 && minor !== 2) throwWarning(state, "unsupported YAML version of the document");
		},
		TAG: function handleTagDirective(state, name, args) {
			let prefix;
			if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
			const handle = args[0];
			prefix = args[1];
			if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
			if (_hasOwnProperty.call(state.tagMap, handle)) throwError(state, "there is a previously declared suffix for \"" + handle + "\" tag handle");
			if (!PATTERN_TAG_URI.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
			try {
				prefix = decodeURIComponent(prefix);
			} catch (err) {
				throwError(state, "tag prefix is malformed: " + prefix);
			}
			state.tagMap[handle] = prefix;
		}
	};
	function captureSegment(state, start, end, checkJson) {
		if (start < end) {
			const _result = state.input.slice(start, end);
			if (checkJson) for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
				const _character = _result.charCodeAt(_position);
				if (!(_character === 9 || _character >= 32 && _character <= 1114111)) throwError(state, "expected valid JSON character");
			}
			else if (PATTERN_NON_PRINTABLE.test(_result)) throwError(state, "the stream contains non-printable characters");
			state.result += _result;
		}
	}
	function chargeMergeWork(state) {
		state.totalMergeKeys++;
		if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
	}
	function mergeMappings(state, destination, source, overridableKeys) {
		if (!common.isObject(source)) throwError(state, "cannot merge mappings; the provided source object is unacceptable");
		chargeMergeWork(state);
		const sourceKeys = Object.keys(source);
		for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
			const key = sourceKeys[index];
			chargeMergeWork(state);
			if (!_hasOwnProperty.call(destination, key)) {
				setProperty(destination, key, source[key]);
				overridableKeys[key] = true;
			}
		}
	}
	function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
		if (Array.isArray(keyNode)) {
			keyNode = Array.prototype.slice.call(keyNode);
			for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
				if (Array.isArray(keyNode[index])) throwError(state, "nested arrays are not supported inside keys");
				if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") keyNode[index] = "[object Object]";
			}
		}
		if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") keyNode = "[object Object]";
		keyNode = String(keyNode);
		if (_result === null) _result = {};
		if (keyTag === "tag:yaml.org,2002:merge") {
			if (Array.isArray(valueNode)) {
				if (valueNode.length > 100) throwError(state, "abnormal merge sequence size");
				for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) mergeMappings(state, _result, valueNode[index], overridableKeys);
			} else mergeMappings(state, _result, valueNode, overridableKeys);
		} else {
			if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
				state.line = startLine || state.line;
				state.lineStart = startLineStart || state.lineStart;
				state.position = startPos || state.position;
				throwError(state, "duplicated mapping key");
			}
			setProperty(_result, keyNode, valueNode);
			delete overridableKeys[keyNode];
		}
		return _result;
	}
	function readLineBreak(state) {
		const ch = state.input.charCodeAt(state.position);
		if (ch === 10) state.position++;
		else if (ch === 13) {
			state.position++;
			if (state.input.charCodeAt(state.position) === 10) state.position++;
		} else throwError(state, "a line break is expected");
		state.line += 1;
		state.lineStart = state.position;
		state.firstTabInLine = -1;
	}
	function skipSeparationSpace(state, allowComments, checkIndent) {
		let lineBreaks = 0;
		let ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			while (isWhiteSpace(ch)) {
				if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
				ch = state.input.charCodeAt(++state.position);
			}
			if (allowComments && ch === 35) do
				ch = state.input.charCodeAt(++state.position);
			while (ch !== 10 && ch !== 13 && ch !== 0);
			if (isEol(ch)) {
				readLineBreak(state);
				ch = state.input.charCodeAt(state.position);
				lineBreaks++;
				state.lineIndent = 0;
				while (ch === 32) {
					state.lineIndent++;
					ch = state.input.charCodeAt(++state.position);
				}
			} else break;
		}
		if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) throwWarning(state, "deficient indentation");
		return lineBreaks;
	}
	function testDocumentSeparator(state) {
		let _position = state.position;
		let ch = state.input.charCodeAt(_position);
		if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
			_position += 3;
			ch = state.input.charCodeAt(_position);
			if (ch === 0 || isWsOrEol(ch)) return true;
		}
		return false;
	}
	function writeFoldedLines(state, count) {
		if (count === 1) state.result += " ";
		else if (count > 1) state.result += common.repeat("\n", count - 1);
	}
	function readPlainScalar(state, nodeIndent, withinFlowCollection) {
		let captureStart;
		let captureEnd;
		let hasPendingContent;
		let _line;
		let _lineStart;
		let _lineIndent;
		const _kind = state.kind;
		const _result = state.result;
		let ch = state.input.charCodeAt(state.position);
		if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) return false;
		if (ch === 63 || ch === 45) {
			const following = state.input.charCodeAt(state.position + 1);
			if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) return false;
		}
		state.kind = "scalar";
		state.result = "";
		captureStart = captureEnd = state.position;
		hasPendingContent = false;
		while (ch !== 0) {
			if (ch === 58) {
				const following = state.input.charCodeAt(state.position + 1);
				if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) break;
			} else if (ch === 35) {
				if (isWsOrEol(state.input.charCodeAt(state.position - 1))) break;
			} else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) break;
			else if (isEol(ch)) {
				_line = state.line;
				_lineStart = state.lineStart;
				_lineIndent = state.lineIndent;
				skipSeparationSpace(state, false, -1);
				if (state.lineIndent >= nodeIndent) {
					hasPendingContent = true;
					ch = state.input.charCodeAt(state.position);
					continue;
				} else {
					state.position = captureEnd;
					state.line = _line;
					state.lineStart = _lineStart;
					state.lineIndent = _lineIndent;
					break;
				}
			}
			if (hasPendingContent) {
				captureSegment(state, captureStart, captureEnd, false);
				writeFoldedLines(state, state.line - _line);
				captureStart = captureEnd = state.position;
				hasPendingContent = false;
			}
			if (!isWhiteSpace(ch)) captureEnd = state.position + 1;
			ch = state.input.charCodeAt(++state.position);
		}
		captureSegment(state, captureStart, captureEnd, false);
		if (state.result) return true;
		state.kind = _kind;
		state.result = _result;
		return false;
	}
	function readSingleQuotedScalar(state, nodeIndent) {
		let captureStart;
		let captureEnd;
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 39) return false;
		state.kind = "scalar";
		state.result = "";
		state.position++;
		captureStart = captureEnd = state.position;
		while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 39) {
			captureSegment(state, captureStart, state.position, true);
			ch = state.input.charCodeAt(++state.position);
			if (ch === 39) {
				captureStart = state.position;
				state.position++;
				captureEnd = state.position;
			} else return true;
		} else if (isEol(ch)) {
			captureSegment(state, captureStart, captureEnd, true);
			writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
			captureStart = captureEnd = state.position;
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
		else {
			state.position++;
			if (!isWhiteSpace(ch)) captureEnd = state.position;
		}
		throwError(state, "unexpected end of the stream within a single quoted scalar");
	}
	function readDoubleQuotedScalar(state, nodeIndent) {
		let captureStart;
		let captureEnd;
		let tmp;
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 34) return false;
		state.kind = "scalar";
		state.result = "";
		state.position++;
		captureStart = captureEnd = state.position;
		while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 34) {
			captureSegment(state, captureStart, state.position, true);
			state.position++;
			return true;
		} else if (ch === 92) {
			captureSegment(state, captureStart, state.position, true);
			ch = state.input.charCodeAt(++state.position);
			if (isEol(ch)) skipSeparationSpace(state, false, nodeIndent);
			else if (ch < 256 && simpleEscapeCheck[ch]) {
				state.result += simpleEscapeMap[ch];
				state.position++;
			} else if ((tmp = escapedHexLen(ch)) > 0) {
				let hexLength = tmp;
				let hexResult = 0;
				for (; hexLength > 0; hexLength--) {
					ch = state.input.charCodeAt(++state.position);
					if ((tmp = fromHexCode(ch)) >= 0) hexResult = (hexResult << 4) + tmp;
					else throwError(state, "expected hexadecimal character");
				}
				state.result += charFromCodepoint(hexResult);
				state.position++;
			} else throwError(state, "unknown escape sequence");
			captureStart = captureEnd = state.position;
		} else if (isEol(ch)) {
			captureSegment(state, captureStart, captureEnd, true);
			writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
			captureStart = captureEnd = state.position;
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
		else {
			state.position++;
			if (!isWhiteSpace(ch)) captureEnd = state.position;
		}
		throwError(state, "unexpected end of the stream within a double quoted scalar");
	}
	function readFlowCollection(state, nodeIndent) {
		let readNext = true;
		let _line;
		let _lineStart;
		let _pos;
		const _tag = state.tag;
		let _result;
		const _anchor = state.anchor;
		let terminator;
		let isPair;
		let isExplicitPair;
		let isMapping;
		const overridableKeys = Object.create(null);
		let keyNode;
		let keyTag;
		let valueNode;
		let ch = state.input.charCodeAt(state.position);
		if (ch === 91) {
			terminator = 93;
			isMapping = false;
			_result = [];
		} else if (ch === 123) {
			terminator = 125;
			isMapping = true;
			_result = {};
		} else return false;
		if (state.anchor !== null) storeAnchor(state, state.anchor, _result);
		ch = state.input.charCodeAt(++state.position);
		while (ch !== 0) {
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if (ch === terminator) {
				state.position++;
				state.tag = _tag;
				state.anchor = _anchor;
				state.kind = isMapping ? "mapping" : "sequence";
				state.result = _result;
				return true;
			} else if (!readNext) throwError(state, "missed comma between flow collection entries");
			else if (ch === 44) throwError(state, "expected the node content, but found ','");
			keyTag = keyNode = valueNode = null;
			isPair = isExplicitPair = false;
			if (ch === 63) {
				if (isWsOrEol(state.input.charCodeAt(state.position + 1))) {
					isPair = isExplicitPair = true;
					state.position++;
					skipSeparationSpace(state, true, nodeIndent);
				}
			}
			_line = state.line;
			_lineStart = state.lineStart;
			_pos = state.position;
			composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
			keyTag = state.tag;
			keyNode = state.result;
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if ((isExplicitPair || state.line === _line) && ch === 58) {
				isPair = true;
				ch = state.input.charCodeAt(++state.position);
				skipSeparationSpace(state, true, nodeIndent);
				composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
				valueNode = state.result;
			}
			if (isMapping) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
			else if (isPair) _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
			else _result.push(keyNode);
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if (ch === 44) {
				readNext = true;
				ch = state.input.charCodeAt(++state.position);
			} else readNext = false;
		}
		throwError(state, "unexpected end of the stream within a flow collection");
	}
	function readBlockScalar(state, nodeIndent) {
		let folding;
		let chomping = CHOMPING_CLIP;
		let didReadContent = false;
		let detectedIndent = false;
		let textIndent = nodeIndent;
		let emptyLines = 0;
		let atMoreIndented = false;
		let tmp;
		let ch = state.input.charCodeAt(state.position);
		if (ch === 124) folding = false;
		else if (ch === 62) folding = true;
		else return false;
		state.kind = "scalar";
		state.result = "";
		while (ch !== 0) {
			ch = state.input.charCodeAt(++state.position);
			if (ch === 43 || ch === 45) {
				if (CHOMPING_CLIP === chomping) chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
				else throwError(state, "repeat of a chomping mode identifier");
			} else if ((tmp = fromDecimalCode(ch)) >= 0) {
				if (tmp === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
				else if (!detectedIndent) {
					textIndent = nodeIndent + tmp - 1;
					detectedIndent = true;
				} else throwError(state, "repeat of an indentation width identifier");
			} else break;
		}
		if (isWhiteSpace(ch)) {
			do
				ch = state.input.charCodeAt(++state.position);
			while (isWhiteSpace(ch));
			if (ch === 35) do
				ch = state.input.charCodeAt(++state.position);
			while (!isEol(ch) && ch !== 0);
		}
		while (ch !== 0) {
			readLineBreak(state);
			state.lineIndent = 0;
			ch = state.input.charCodeAt(state.position);
			while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
				state.lineIndent++;
				ch = state.input.charCodeAt(++state.position);
			}
			if (!detectedIndent && state.lineIndent > textIndent) textIndent = state.lineIndent;
			if (isEol(ch)) {
				emptyLines++;
				continue;
			}
			if (!detectedIndent && textIndent === 0) throwError(state, "missing indentation for block scalar");
			if (state.lineIndent < textIndent) {
				if (chomping === CHOMPING_KEEP) state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
				else if (chomping === CHOMPING_CLIP) {
					if (didReadContent) state.result += "\n";
				}
				break;
			}
			if (folding) {
				if (isWhiteSpace(ch)) {
					atMoreIndented = true;
					state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
				} else if (atMoreIndented) {
					atMoreIndented = false;
					state.result += common.repeat("\n", emptyLines + 1);
				} else if (emptyLines === 0) {
					if (didReadContent) state.result += " ";
				} else state.result += common.repeat("\n", emptyLines);
			} else state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
			didReadContent = true;
			detectedIndent = true;
			emptyLines = 0;
			const captureStart = state.position;
			while (!isEol(ch) && ch !== 0) ch = state.input.charCodeAt(++state.position);
			captureSegment(state, captureStart, state.position, false);
		}
		return true;
	}
	function readBlockSequence(state, nodeIndent) {
		const _tag = state.tag;
		const _anchor = state.anchor;
		const _result = [];
		let detected = false;
		if (state.firstTabInLine !== -1) return false;
		if (state.anchor !== null) storeAnchor(state, state.anchor, _result);
		let ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			if (state.firstTabInLine !== -1) {
				state.position = state.firstTabInLine;
				throwError(state, "tab characters must not be used in indentation");
			}
			if (ch !== 45) break;
			if (!isWsOrEol(state.input.charCodeAt(state.position + 1))) break;
			detected = true;
			state.position++;
			if (skipSeparationSpace(state, true, -1)) {
				if (state.lineIndent <= nodeIndent) {
					_result.push(null);
					ch = state.input.charCodeAt(state.position);
					continue;
				}
			}
			const _line = state.line;
			composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
			_result.push(state.result);
			skipSeparationSpace(state, true, -1);
			ch = state.input.charCodeAt(state.position);
			if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a sequence entry");
			else if (state.lineIndent < nodeIndent) break;
		}
		if (detected) {
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = "sequence";
			state.result = _result;
			return true;
		}
		return false;
	}
	function readBlockMapping(state, nodeIndent, flowIndent) {
		let allowCompact;
		let _keyLine;
		let _keyLineStart;
		let _keyPos;
		const _tag = state.tag;
		const _anchor = state.anchor;
		const _result = {};
		const overridableKeys = Object.create(null);
		let keyTag = null;
		let keyNode = null;
		let valueNode = null;
		let atExplicitKey = false;
		let detected = false;
		if (state.firstTabInLine !== -1) return false;
		if (state.anchor !== null) storeAnchor(state, state.anchor, _result);
		let ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			if (!atExplicitKey && state.firstTabInLine !== -1) {
				state.position = state.firstTabInLine;
				throwError(state, "tab characters must not be used in indentation");
			}
			const following = state.input.charCodeAt(state.position + 1);
			const _line = state.line;
			if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
				if (ch === 63) {
					if (atExplicitKey) {
						storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
						keyTag = keyNode = valueNode = null;
					}
					detected = true;
					atExplicitKey = true;
					allowCompact = true;
				} else if (atExplicitKey) {
					atExplicitKey = false;
					allowCompact = true;
				} else throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
				state.position += 1;
				ch = following;
			} else {
				_keyLine = state.line;
				_keyLineStart = state.lineStart;
				_keyPos = state.position;
				if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) break;
				if (state.line === _line) {
					ch = state.input.charCodeAt(state.position);
					while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
					if (ch === 58) {
						ch = state.input.charCodeAt(++state.position);
						if (!isWsOrEol(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
						if (atExplicitKey) {
							storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
							keyTag = keyNode = valueNode = null;
						}
						detected = true;
						atExplicitKey = false;
						allowCompact = false;
						keyTag = state.tag;
						keyNode = state.result;
					} else if (detected) throwError(state, "can not read an implicit mapping pair; a colon is missed");
					else {
						state.tag = _tag;
						state.anchor = _anchor;
						return true;
					}
				} else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
				else {
					state.tag = _tag;
					state.anchor = _anchor;
					return true;
				}
			}
			if (state.line === _line || state.lineIndent > nodeIndent) {
				if (atExplicitKey) {
					_keyLine = state.line;
					_keyLineStart = state.lineStart;
					_keyPos = state.position;
				}
				if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
					if (atExplicitKey) keyNode = state.result;
					else valueNode = state.result;
				}
				if (!atExplicitKey) {
					storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
					keyTag = keyNode = valueNode = null;
				}
				skipSeparationSpace(state, true, -1);
				ch = state.input.charCodeAt(state.position);
			}
			if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a mapping entry");
			else if (state.lineIndent < nodeIndent) break;
		}
		if (atExplicitKey) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
		if (detected) {
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = "mapping";
			state.result = _result;
		}
		return detected;
	}
	function readTagProperty(state) {
		let isVerbatim = false;
		let isNamed = false;
		let tagHandle;
		let tagName;
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 33) return false;
		if (state.tag !== null) throwError(state, "duplication of a tag property");
		ch = state.input.charCodeAt(++state.position);
		if (ch === 60) {
			isVerbatim = true;
			ch = state.input.charCodeAt(++state.position);
		} else if (ch === 33) {
			isNamed = true;
			tagHandle = "!!";
			ch = state.input.charCodeAt(++state.position);
		} else tagHandle = "!";
		let _position = state.position;
		if (isVerbatim) {
			do
				ch = state.input.charCodeAt(++state.position);
			while (ch !== 0 && ch !== 62);
			if (state.position < state.length) {
				tagName = state.input.slice(_position, state.position);
				ch = state.input.charCodeAt(++state.position);
			} else throwError(state, "unexpected end of the stream within a verbatim tag");
		} else {
			while (ch !== 0 && !isWsOrEol(ch)) {
				if (ch === 33) {
					if (!isNamed) {
						tagHandle = state.input.slice(_position - 1, state.position + 1);
						if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
						isNamed = true;
						_position = state.position + 1;
					} else throwError(state, "tag suffix cannot contain exclamation marks");
				}
				ch = state.input.charCodeAt(++state.position);
			}
			tagName = state.input.slice(_position, state.position);
			if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
		}
		if (tagName && !PATTERN_TAG_URI.test(tagName)) throwError(state, "tag name cannot contain such characters: " + tagName);
		try {
			tagName = decodeURIComponent(tagName);
		} catch (err) {
			throwError(state, "tag name is malformed: " + tagName);
		}
		if (isVerbatim) state.tag = tagName;
		else if (_hasOwnProperty.call(state.tagMap, tagHandle)) state.tag = state.tagMap[tagHandle] + tagName;
		else if (tagHandle === "!") state.tag = "!" + tagName;
		else if (tagHandle === "!!") state.tag = "tag:yaml.org,2002:" + tagName;
		else throwError(state, "undeclared tag handle \"" + tagHandle + "\"");
		return true;
	}
	function readAnchorProperty(state) {
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 38) return false;
		if (state.anchor !== null) throwError(state, "duplication of an anchor property");
		ch = state.input.charCodeAt(++state.position);
		const _position = state.position;
		while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) ch = state.input.charCodeAt(++state.position);
		if (state.position === _position) throwError(state, "name of an anchor node must contain at least one character");
		state.anchor = state.input.slice(_position, state.position);
		return true;
	}
	function readAlias(state) {
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 42) return false;
		ch = state.input.charCodeAt(++state.position);
		const _position = state.position;
		while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) ch = state.input.charCodeAt(++state.position);
		if (state.position === _position) throwError(state, "name of an alias node must contain at least one character");
		const alias = state.input.slice(_position, state.position);
		if (!_hasOwnProperty.call(state.anchorMap, alias)) throwError(state, "unidentified alias \"" + alias + "\"");
		state.result = state.anchorMap[alias];
		skipSeparationSpace(state, true, -1);
		return true;
	}
	function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
		const fallbackState = snapshotState(state);
		beginAnchorTransaction(state);
		restoreState(state, propertyStart);
		state.tag = null;
		state.anchor = null;
		state.kind = null;
		state.result = null;
		if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
			commitAnchorTransaction(state);
			return true;
		}
		rollbackAnchorTransaction(state);
		restoreState(state, fallbackState);
		return false;
	}
	function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
		let allowBlockScalars;
		let allowBlockCollections;
		let indentStatus = 1;
		let atNewLine = false;
		let hasContent = false;
		let propertyStart = null;
		let type;
		let flowIndent;
		let blockIndent;
		if (state.depth >= state.maxDepth) throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
		state.depth += 1;
		if (state.listener !== null) state.listener("open", state);
		state.tag = null;
		state.anchor = null;
		state.kind = null;
		state.result = null;
		const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
		if (allowToSeek) {
			if (skipSeparationSpace(state, true, -1)) {
				atNewLine = true;
				if (state.lineIndent > parentIndent) indentStatus = 1;
				else if (state.lineIndent === parentIndent) indentStatus = 0;
				else if (state.lineIndent < parentIndent) indentStatus = -1;
			}
		}
		if (indentStatus === 1) while (true) {
			const ch = state.input.charCodeAt(state.position);
			const propertyState = snapshotState(state);
			if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) break;
			if (!readTagProperty(state) && !readAnchorProperty(state)) break;
			if (propertyStart === null) propertyStart = propertyState;
			if (skipSeparationSpace(state, true, -1)) {
				atNewLine = true;
				allowBlockCollections = allowBlockStyles;
				if (state.lineIndent > parentIndent) indentStatus = 1;
				else if (state.lineIndent === parentIndent) indentStatus = 0;
				else if (state.lineIndent < parentIndent) indentStatus = -1;
			} else allowBlockCollections = false;
		}
		if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
		if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
			if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) flowIndent = parentIndent;
			else flowIndent = parentIndent + 1;
			blockIndent = state.position - state.lineStart;
			if (indentStatus === 1) {
				if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) hasContent = true;
				else {
					const ch = state.input.charCodeAt(state.position);
					if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(state, propertyStart, propertyStart.position - propertyStart.lineStart, flowIndent)) hasContent = true;
					else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) hasContent = true;
					else if (readAlias(state)) {
						hasContent = true;
						if (state.tag !== null || state.anchor !== null) throwError(state, "alias node should not have any properties");
					} else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
						hasContent = true;
						if (state.tag === null) state.tag = "?";
					}
					if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
				}
			} else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
		}
		if (state.tag === null) {
			if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
		} else if (state.tag === "?") {
			if (state.result !== null && state.kind !== "scalar") throwError(state, "unacceptable node kind for !<?> tag; it should be \"scalar\", not \"" + state.kind + "\"");
			for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
				type = state.implicitTypes[typeIndex];
				if (type.resolve(state.result)) {
					state.result = type.construct(state.result);
					state.tag = type.tag;
					if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
					break;
				}
			}
		} else if (state.tag !== "!") {
			if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) type = state.typeMap[state.kind || "fallback"][state.tag];
			else {
				type = null;
				const typeList = state.typeMap.multi[state.kind || "fallback"];
				for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
					type = typeList[typeIndex];
					break;
				}
			}
			if (!type) throwError(state, "unknown tag !<" + state.tag + ">");
			if (state.result !== null && type.kind !== state.kind) throwError(state, "unacceptable node kind for !<" + state.tag + "> tag; it should be \"" + type.kind + "\", not \"" + state.kind + "\"");
			if (!type.resolve(state.result, state.tag)) throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
			else {
				state.result = type.construct(state.result, state.tag);
				if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
			}
		}
		if (state.listener !== null) state.listener("close", state);
		state.depth -= 1;
		return state.tag !== null || state.anchor !== null || hasContent;
	}
	function readDocument(state) {
		const documentStart = state.position;
		let hasDirectives = false;
		let ch;
		state.version = null;
		state.checkLineBreaks = state.legacy;
		state.tagMap = Object.create(null);
		state.anchorMap = Object.create(null);
		while ((ch = state.input.charCodeAt(state.position)) !== 0) {
			skipSeparationSpace(state, true, -1);
			ch = state.input.charCodeAt(state.position);
			if (state.lineIndent > 0 || ch !== 37) break;
			hasDirectives = true;
			ch = state.input.charCodeAt(++state.position);
			let _position = state.position;
			while (ch !== 0 && !isWsOrEol(ch)) ch = state.input.charCodeAt(++state.position);
			const directiveName = state.input.slice(_position, state.position);
			const directiveArgs = [];
			if (directiveName.length < 1) throwError(state, "directive name must not be less than one character in length");
			while (ch !== 0) {
				while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
				if (ch === 35) {
					do
						ch = state.input.charCodeAt(++state.position);
					while (ch !== 0 && !isEol(ch));
					break;
				}
				if (isEol(ch)) break;
				_position = state.position;
				while (ch !== 0 && !isWsOrEol(ch)) ch = state.input.charCodeAt(++state.position);
				directiveArgs.push(state.input.slice(_position, state.position));
			}
			if (ch !== 0) readLineBreak(state);
			if (_hasOwnProperty.call(directiveHandlers, directiveName)) directiveHandlers[directiveName](state, directiveName, directiveArgs);
			else throwWarning(state, "unknown document directive \"" + directiveName + "\"");
		}
		skipSeparationSpace(state, true, -1);
		if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
			state.position += 3;
			skipSeparationSpace(state, true, -1);
		} else if (hasDirectives) throwError(state, "directives end mark is expected");
		composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
		skipSeparationSpace(state, true, -1);
		if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) throwWarning(state, "non-ASCII line breaks are interpreted as content");
		state.documents.push(state.result);
		if (state.position === state.lineStart && testDocumentSeparator(state)) {
			if (state.input.charCodeAt(state.position) === 46) {
				state.position += 3;
				skipSeparationSpace(state, true, -1);
			}
			return;
		}
		if (state.position < state.length - 1) throwError(state, "end of the stream or a document separator is expected");
	}
	function loadDocuments(input, options) {
		input = String(input);
		options = options || {};
		if (input.length !== 0) {
			if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) input += "\n";
			if (input.charCodeAt(0) === 65279) input = input.slice(1);
		}
		const state = new State(input, options);
		const nullpos = input.indexOf("\0");
		if (nullpos !== -1) {
			state.position = nullpos;
			throwError(state, "null byte is not allowed in input");
		}
		state.input += "\0";
		while (state.input.charCodeAt(state.position) === 32) {
			state.lineIndent += 1;
			state.position += 1;
		}
		while (state.position < state.length - 1) readDocument(state);
		return state.documents;
	}
	function loadAll(input, iterator, options) {
		if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
			options = iterator;
			iterator = null;
		}
		const documents = loadDocuments(input, options);
		if (typeof iterator !== "function") return documents;
		for (let index = 0, length = documents.length; index < length; index += 1) iterator(documents[index]);
	}
	function load(input, options) {
		const documents = loadDocuments(input, options);
		if (documents.length === 0) return;
		else if (documents.length === 1) return documents[0];
		throw new YAMLException("expected a single document in the stream, but found more");
	}
	module.exports.loadAll = loadAll;
	module.exports.load = load;
}));
//#endregion
//#region node_modules/js-yaml/lib/dumper.js
var require_dumper = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var common = require_common();
	var YAMLException = require_exception();
	var DEFAULT_SCHEMA = require_default();
	var _toString = Object.prototype.toString;
	var _hasOwnProperty = Object.prototype.hasOwnProperty;
	var CHAR_BOM = 65279;
	var CHAR_TAB = 9;
	var CHAR_LINE_FEED = 10;
	var CHAR_CARRIAGE_RETURN = 13;
	var CHAR_SPACE = 32;
	var CHAR_EXCLAMATION = 33;
	var CHAR_DOUBLE_QUOTE = 34;
	var CHAR_SHARP = 35;
	var CHAR_PERCENT = 37;
	var CHAR_AMPERSAND = 38;
	var CHAR_SINGLE_QUOTE = 39;
	var CHAR_ASTERISK = 42;
	var CHAR_COMMA = 44;
	var CHAR_MINUS = 45;
	var CHAR_COLON = 58;
	var CHAR_EQUALS = 61;
	var CHAR_GREATER_THAN = 62;
	var CHAR_QUESTION = 63;
	var CHAR_COMMERCIAL_AT = 64;
	var CHAR_LEFT_SQUARE_BRACKET = 91;
	var CHAR_RIGHT_SQUARE_BRACKET = 93;
	var CHAR_GRAVE_ACCENT = 96;
	var CHAR_LEFT_CURLY_BRACKET = 123;
	var CHAR_VERTICAL_LINE = 124;
	var CHAR_RIGHT_CURLY_BRACKET = 125;
	var ESCAPE_SEQUENCES = {};
	ESCAPE_SEQUENCES[0] = "\\0";
	ESCAPE_SEQUENCES[7] = "\\a";
	ESCAPE_SEQUENCES[8] = "\\b";
	ESCAPE_SEQUENCES[9] = "\\t";
	ESCAPE_SEQUENCES[10] = "\\n";
	ESCAPE_SEQUENCES[11] = "\\v";
	ESCAPE_SEQUENCES[12] = "\\f";
	ESCAPE_SEQUENCES[13] = "\\r";
	ESCAPE_SEQUENCES[27] = "\\e";
	ESCAPE_SEQUENCES[34] = "\\\"";
	ESCAPE_SEQUENCES[92] = "\\\\";
	ESCAPE_SEQUENCES[133] = "\\N";
	ESCAPE_SEQUENCES[160] = "\\_";
	ESCAPE_SEQUENCES[8232] = "\\L";
	ESCAPE_SEQUENCES[8233] = "\\P";
	var DEPRECATED_BOOLEANS_SYNTAX = [
		"y",
		"Y",
		"yes",
		"Yes",
		"YES",
		"on",
		"On",
		"ON",
		"n",
		"N",
		"no",
		"No",
		"NO",
		"off",
		"Off",
		"OFF"
	];
	var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
	function compileStyleMap(schema, map) {
		if (map === null) return {};
		const result = {};
		const keys = Object.keys(map);
		for (let index = 0, length = keys.length; index < length; index += 1) {
			let tag = keys[index];
			let style = String(map[tag]);
			if (tag.slice(0, 2) === "!!") tag = "tag:yaml.org,2002:" + tag.slice(2);
			const type = schema.compiledTypeMap["fallback"][tag];
			if (type && _hasOwnProperty.call(type.styleAliases, style)) style = type.styleAliases[style];
			result[tag] = style;
		}
		return result;
	}
	function encodeHex(character) {
		let handle;
		let length;
		const string = character.toString(16).toUpperCase();
		if (character <= 255) {
			handle = "x";
			length = 2;
		} else if (character <= 65535) {
			handle = "u";
			length = 4;
		} else if (character <= 4294967295) {
			handle = "U";
			length = 8;
		} else throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
		return "\\" + handle + common.repeat("0", length - string.length) + string;
	}
	var QUOTING_TYPE_SINGLE = 1;
	var QUOTING_TYPE_DOUBLE = 2;
	function State(options) {
		this.schema = options["schema"] || DEFAULT_SCHEMA;
		this.indent = Math.max(1, options["indent"] || 2);
		this.noArrayIndent = options["noArrayIndent"] || false;
		this.skipInvalid = options["skipInvalid"] || false;
		this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
		this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
		this.sortKeys = options["sortKeys"] || false;
		this.lineWidth = options["lineWidth"] || 80;
		this.noRefs = options["noRefs"] || false;
		this.noCompatMode = options["noCompatMode"] || false;
		this.condenseFlow = options["condenseFlow"] || false;
		this.quotingType = options["quotingType"] === "\"" ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
		this.forceQuotes = options["forceQuotes"] || false;
		this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
		this.implicitTypes = this.schema.compiledImplicit;
		this.explicitTypes = this.schema.compiledExplicit;
		this.tag = null;
		this.result = "";
		this.duplicates = [];
		this.usedDuplicates = null;
	}
	function indentString(string, spaces) {
		const ind = common.repeat(" ", spaces);
		let position = 0;
		let result = "";
		const length = string.length;
		while (position < length) {
			let line;
			const next = string.indexOf("\n", position);
			if (next === -1) {
				line = string.slice(position);
				position = length;
			} else {
				line = string.slice(position, next + 1);
				position = next + 1;
			}
			if (line.length && line !== "\n") result += ind;
			result += line;
		}
		return result;
	}
	function generateNextLine(state, level) {
		return "\n" + common.repeat(" ", state.indent * level);
	}
	function testImplicitResolving(state, str) {
		for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) if (state.implicitTypes[index].resolve(str)) return true;
		return false;
	}
	function isWhitespace(c) {
		return c === CHAR_SPACE || c === CHAR_TAB;
	}
	function isPrintable(c) {
		return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
	}
	function isNsCharOrWhitespace(c) {
		return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
	}
	function isPlainSafe(c, prev, inblock) {
		const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
		const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
		return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
	}
	function isPlainSafeFirst(c) {
		return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
	}
	function isPlainSafeLast(c) {
		return !isWhitespace(c) && c !== CHAR_COLON;
	}
	function codePointAt(string, pos) {
		const first = string.charCodeAt(pos);
		let second;
		if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
			second = string.charCodeAt(pos + 1);
			if (second >= 56320 && second <= 57343) return (first - 55296) * 1024 + second - 56320 + 65536;
		}
		return first;
	}
	function needIndentIndicator(string) {
		return /^\n* /.test(string);
	}
	var STYLE_PLAIN = 1;
	var STYLE_SINGLE = 2;
	var STYLE_LITERAL = 3;
	var STYLE_FOLDED = 4;
	var STYLE_DOUBLE = 5;
	function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
		let i;
		let char = 0;
		let prevChar = null;
		let hasLineBreak = false;
		let hasFoldableLine = false;
		const shouldTrackWidth = lineWidth !== -1;
		let previousLineBreak = -1;
		let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
		if (singleLineOnly || forceQuotes) for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
			char = codePointAt(string, i);
			if (!isPrintable(char)) return STYLE_DOUBLE;
			plain = plain && isPlainSafe(char, prevChar, inblock);
			prevChar = char;
		}
		else {
			for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
				char = codePointAt(string, i);
				if (char === CHAR_LINE_FEED) {
					hasLineBreak = true;
					if (shouldTrackWidth) {
						hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
						previousLineBreak = i;
					}
				} else if (!isPrintable(char)) return STYLE_DOUBLE;
				plain = plain && isPlainSafe(char, prevChar, inblock);
				prevChar = char;
			}
			hasFoldableLine = hasFoldableLine || shouldTrackWidth && i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
		}
		if (!hasLineBreak && !hasFoldableLine) {
			if (plain && !forceQuotes && !testAmbiguousType(string)) return STYLE_PLAIN;
			return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
		}
		if (indentPerLevel > 9 && needIndentIndicator(string)) return STYLE_DOUBLE;
		if (!forceQuotes) return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
		return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
	}
	function writeScalar(state, string, level, iskey, inblock) {
		state.dump = function() {
			if (string.length === 0) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"\"" : "''";
			if (!state.noCompatMode) {
				if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"" + string + "\"" : "'" + string + "'";
			}
			const indent = state.indent * Math.max(1, level);
			const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
			const singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
			function testAmbiguity(string) {
				return testImplicitResolving(state, string);
			}
			switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
				case STYLE_PLAIN: return string;
				case STYLE_SINGLE: return "'" + string.replace(/'/g, "''") + "'";
				case STYLE_LITERAL: return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
				case STYLE_FOLDED: return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
				case STYLE_DOUBLE: return "\"" + escapeString(string, lineWidth) + "\"";
				default: throw new YAMLException("impossible error: invalid scalar style");
			}
		}();
	}
	function blockHeader(string, indentPerLevel) {
		const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
		const clip = string[string.length - 1] === "\n";
		return indentIndicator + (clip && (string[string.length - 2] === "\n" || string === "\n") ? "+" : clip ? "" : "-") + "\n";
	}
	function dropEndingNewline(string) {
		return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
	}
	function foldString(string, width) {
		const lineRe = /(\n+)([^\n]*)/g;
		let result = function() {
			let nextLF = string.indexOf("\n");
			nextLF = nextLF !== -1 ? nextLF : string.length;
			lineRe.lastIndex = nextLF;
			return foldLine(string.slice(0, nextLF), width);
		}();
		let prevMoreIndented = string[0] === "\n" || string[0] === " ";
		let moreIndented;
		let match;
		while (match = lineRe.exec(string)) {
			const prefix = match[1];
			const line = match[2];
			moreIndented = line[0] === " ";
			result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
			prevMoreIndented = moreIndented;
		}
		return result;
	}
	function foldLine(line, width) {
		if (line === "" || line[0] === " ") return line;
		const breakRe = / [^ ]/g;
		let match;
		let start = 0;
		let end;
		let curr = 0;
		let next = 0;
		let result = "";
		while (match = breakRe.exec(line)) {
			next = match.index;
			if (next - start > width) {
				end = curr > start ? curr : next;
				result += "\n" + line.slice(start, end);
				start = end + 1;
			}
			curr = next;
		}
		result += "\n";
		if (line.length - start > width && curr > start) result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
		else result += line.slice(start);
		return result.slice(1);
	}
	function escapeString(string) {
		let result = "";
		let char = 0;
		for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
			char = codePointAt(string, i);
			const escapeSeq = ESCAPE_SEQUENCES[char];
			if (!escapeSeq && isPrintable(char)) {
				result += string[i];
				if (char >= 65536) result += string[i + 1];
			} else result += escapeSeq || encodeHex(char);
		}
		return result;
	}
	function writeFlowSequence(state, level, object) {
		let _result = "";
		const _tag = state.tag;
		for (let index = 0, length = object.length; index < length; index += 1) {
			let value = object[index];
			if (state.replacer) value = state.replacer.call(object, String(index), value);
			if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
				if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
				_result += state.dump;
			}
		}
		state.tag = _tag;
		state.dump = "[" + _result + "]";
	}
	function writeBlockSequence(state, level, object, compact) {
		let _result = "";
		const _tag = state.tag;
		for (let index = 0, length = object.length; index < length; index += 1) {
			let value = object[index];
			if (state.replacer) value = state.replacer.call(object, String(index), value);
			if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
				if (!compact || _result !== "") _result += generateNextLine(state, level);
				if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) _result += "-";
				else _result += "- ";
				_result += state.dump;
			}
		}
		state.tag = _tag;
		state.dump = _result || "[]";
	}
	function writeFlowMapping(state, level, object) {
		let _result = "";
		const _tag = state.tag;
		const objectKeyList = Object.keys(object);
		for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
			let pairBuffer = "";
			if (_result !== "") pairBuffer += ", ";
			if (state.condenseFlow) pairBuffer += "\"";
			const objectKey = objectKeyList[index];
			let objectValue = object[objectKey];
			if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
			if (!writeNode(state, level, objectKey, false, false)) continue;
			if (state.dump.length > 1024) pairBuffer += "? ";
			pairBuffer += state.dump + (state.condenseFlow ? "\"" : "") + ":" + (state.condenseFlow ? "" : " ");
			if (!writeNode(state, level, objectValue, false, false)) continue;
			pairBuffer += state.dump;
			_result += pairBuffer;
		}
		state.tag = _tag;
		state.dump = "{" + _result + "}";
	}
	function writeBlockMapping(state, level, object, compact) {
		let _result = "";
		const _tag = state.tag;
		const objectKeyList = Object.keys(object);
		if (state.sortKeys === true) objectKeyList.sort();
		else if (typeof state.sortKeys === "function") objectKeyList.sort(state.sortKeys);
		else if (state.sortKeys) throw new YAMLException("sortKeys must be a boolean or a function");
		for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
			let pairBuffer = "";
			if (!compact || _result !== "") pairBuffer += generateNextLine(state, level);
			const objectKey = objectKeyList[index];
			let objectValue = object[objectKey];
			if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
			if (!writeNode(state, level + 1, objectKey, true, true, true)) continue;
			const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
			if (explicitPair) {
				if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += "?";
				else pairBuffer += "? ";
			}
			pairBuffer += state.dump;
			if (explicitPair) pairBuffer += generateNextLine(state, level);
			if (!writeNode(state, level + 1, objectValue, true, explicitPair)) continue;
			if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += ":";
			else pairBuffer += ": ";
			pairBuffer += state.dump;
			_result += pairBuffer;
		}
		state.tag = _tag;
		state.dump = _result || "{}";
	}
	function detectType(state, object, explicit) {
		const typeList = explicit ? state.explicitTypes : state.implicitTypes;
		for (let index = 0, length = typeList.length; index < length; index += 1) {
			const type = typeList[index];
			if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
				if (explicit) {
					if (type.multi && type.representName) state.tag = type.representName(object);
					else state.tag = type.tag;
				} else state.tag = "?";
				if (type.represent) {
					const style = state.styleMap[type.tag] || type.defaultStyle;
					let _result;
					if (_toString.call(type.represent) === "[object Function]") _result = type.represent(object, style);
					else if (_hasOwnProperty.call(type.represent, style)) _result = type.represent[style](object, style);
					else throw new YAMLException("!<" + type.tag + "> tag resolver accepts not \"" + style + "\" style");
					state.dump = _result;
				}
				return true;
			}
		}
		return false;
	}
	function writeNode(state, level, object, block, compact, iskey, isblockseq) {
		state.tag = null;
		state.dump = object;
		if (!detectType(state, object, false)) detectType(state, object, true);
		const type = _toString.call(state.dump);
		const inblock = block;
		if (block) block = state.flowLevel < 0 || state.flowLevel > level;
		const objectOrArray = type === "[object Object]" || type === "[object Array]";
		let duplicateIndex;
		let duplicate;
		if (objectOrArray) {
			duplicateIndex = state.duplicates.indexOf(object);
			duplicate = duplicateIndex !== -1;
		}
		if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) compact = false;
		if (duplicate && state.usedDuplicates[duplicateIndex]) state.dump = "*ref_" + duplicateIndex;
		else {
			if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) state.usedDuplicates[duplicateIndex] = true;
			if (type === "[object Object]") {
				if (block && Object.keys(state.dump).length !== 0) {
					writeBlockMapping(state, level, state.dump, compact);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
				} else {
					writeFlowMapping(state, level, state.dump);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
				}
			} else if (type === "[object Array]") {
				if (block && state.dump.length !== 0) {
					if (state.noArrayIndent && !isblockseq && level > 0) writeBlockSequence(state, level - 1, state.dump, compact);
					else writeBlockSequence(state, level, state.dump, compact);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
				} else {
					writeFlowSequence(state, level, state.dump);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
				}
			} else if (type === "[object String]") {
				if (state.tag !== "?") writeScalar(state, state.dump, level, iskey, inblock);
			} else if (type === "[object Undefined]") return false;
			else {
				if (state.skipInvalid) return false;
				throw new YAMLException("unacceptable kind of an object to dump " + type);
			}
			if (state.tag !== null && state.tag !== "?") {
				let tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
				if (state.tag[0] === "!") tagStr = "!" + tagStr;
				else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") tagStr = "!!" + tagStr.slice(18);
				else tagStr = "!<" + tagStr + ">";
				state.dump = tagStr + " " + state.dump;
			}
		}
		return true;
	}
	function getDuplicateReferences(object, state) {
		const objects = [];
		const duplicatesIndexes = [];
		inspectNode(object, objects, duplicatesIndexes);
		const length = duplicatesIndexes.length;
		for (let index = 0; index < length; index += 1) state.duplicates.push(objects[duplicatesIndexes[index]]);
		state.usedDuplicates = new Array(length);
	}
	function inspectNode(object, objects, duplicatesIndexes) {
		if (object !== null && typeof object === "object") {
			const index = objects.indexOf(object);
			if (index !== -1) {
				if (duplicatesIndexes.indexOf(index) === -1) duplicatesIndexes.push(index);
			} else {
				objects.push(object);
				if (Array.isArray(object)) for (let i = 0, length = object.length; i < length; i += 1) inspectNode(object[i], objects, duplicatesIndexes);
				else {
					const objectKeyList = Object.keys(object);
					for (let i = 0, length = objectKeyList.length; i < length; i += 1) inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
				}
			}
		}
	}
	function dump(input, options) {
		options = options || {};
		const state = new State(options);
		if (!state.noRefs) getDuplicateReferences(input, state);
		let value = input;
		if (state.replacer) value = state.replacer.call({ "": value }, "", value);
		if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
		return "";
	}
	module.exports.dump = dump;
}));
//#endregion
//#region node_modules/js-yaml/index.js
var require_js_yaml = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var loader = require_loader();
	var dumper = require_dumper();
	function renamed(from, to) {
		return function() {
			throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
		};
	}
	module.exports.Type = require_type();
	module.exports.Schema = require_schema();
	module.exports.FAILSAFE_SCHEMA = require_failsafe();
	module.exports.JSON_SCHEMA = require_json();
	module.exports.CORE_SCHEMA = require_core();
	module.exports.DEFAULT_SCHEMA = require_default();
	module.exports.load = loader.load;
	module.exports.loadAll = loader.loadAll;
	module.exports.dump = dumper.dump;
	module.exports.YAMLException = require_exception();
	module.exports.types = {
		binary: require_binary(),
		float: require_float(),
		map: require_map(),
		null: require_null(),
		pairs: require_pairs(),
		set: require_set(),
		timestamp: require_timestamp(),
		bool: require_bool(),
		int: require_int(),
		merge: require_merge(),
		omap: require_omap(),
		seq: require_seq(),
		str: require_str()
	};
	module.exports.safeLoad = renamed("safeLoad", "load");
	module.exports.safeLoadAll = renamed("safeLoadAll", "loadAll");
	module.exports.safeDump = renamed("safeDump", "dump");
}));
//#endregion
//#region node_modules/lazy-val/out/main.js
var require_main$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Lazy = void 0;
	var Lazy = class {
		constructor(creator) {
			this._value = null;
			this.creator = creator;
		}
		get hasValue() {
			return this.creator == null;
		}
		get value() {
			if (this.creator == null) return this._value;
			const result = this.creator();
			this.value = result;
			return result;
		}
		set value(value) {
			this._value = value;
			this.creator = null;
		}
	};
	exports.Lazy = Lazy;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/internal/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		MAX_LENGTH: 256,
		MAX_SAFE_COMPONENT_LENGTH: 16,
		MAX_SAFE_BUILD_LENGTH: 250,
		MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER || 
		/* istanbul ignore next */ 9007199254740991,
		RELEASE_TYPES: [
			"major",
			"premajor",
			"minor",
			"preminor",
			"patch",
			"prepatch",
			"prerelease"
		],
		SEMVER_SPEC_VERSION: "2.0.0",
		FLAG_INCLUDE_PRERELEASE: 1,
		FLAG_LOOSE: 2
	};
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/internal/debug.js
var require_debug = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {};
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/internal/re.js
var require_re = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH, MAX_LENGTH } = require_constants();
	var debug = require_debug();
	exports = module.exports = {};
	var re = exports.re = [];
	var safeRe = exports.safeRe = [];
	var src = exports.src = [];
	var safeSrc = exports.safeSrc = [];
	var t = exports.t = {};
	var R = 0;
	var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
	var safeRegexReplacements = [
		["\\s", 1],
		["\\d", MAX_LENGTH],
		[LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
	];
	var makeSafeRegex = (value) => {
		for (const [token, max] of safeRegexReplacements) value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
		return value;
	};
	var createToken = (name, value, isGlobal) => {
		const safe = makeSafeRegex(value);
		const index = R++;
		debug(name, index, value);
		t[name] = index;
		src[index] = value;
		safeSrc[index] = safe;
		re[index] = new RegExp(value, isGlobal ? "g" : void 0);
		safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
	};
	createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
	createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
	createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
	createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
	createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
	createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
	createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
	createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
	createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
	createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
	createToken("FULL", `^${src[t.FULLPLAIN]}$`);
	createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
	createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
	createToken("GTLT", "((?:<|>)?=?)");
	createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
	createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
	createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
	createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
	createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("COERCEPLAIN", `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
	createToken("COERCERTL", src[t.COERCE], true);
	createToken("COERCERTLFULL", src[t.COERCEFULL], true);
	createToken("LONETILDE", "(?:~>?)");
	createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
	exports.tildeTrimReplace = "$1~";
	createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
	createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("LONECARET", "(?:\\^)");
	createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
	exports.caretTrimReplace = "$1^";
	createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
	createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
	createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
	createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
	exports.comparatorTrimReplace = "$1$2$3";
	createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
	createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
	createToken("STAR", "(<|>)?=?\\s*\\*");
	createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
	createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/internal/parse-options.js
var require_parse_options = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var looseOption = Object.freeze({ loose: true });
	var emptyOpts = Object.freeze({});
	var parseOptions = (options) => {
		if (!options) return emptyOpts;
		if (typeof options !== "object") return looseOption;
		return options;
	};
	module.exports = parseOptions;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/internal/identifiers.js
var require_identifiers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var numeric = /^[0-9]+$/;
	var compareIdentifiers = (a, b) => {
		if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
		const anum = numeric.test(a);
		const bnum = numeric.test(b);
		if (anum && bnum) {
			a = +a;
			b = +b;
		}
		return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
	};
	var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
	module.exports = {
		compareIdentifiers,
		rcompareIdentifiers
	};
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/classes/semver.js
var require_semver$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var debug = require_debug();
	var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
	var { safeRe: re, t } = require_re();
	var parseOptions = require_parse_options();
	var { compareIdentifiers } = require_identifiers();
	module.exports = class SemVer {
		constructor(version, options) {
			options = parseOptions(options);
			if (version instanceof SemVer) {
				if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) return version;
				else version = version.version;
			} else if (typeof version !== "string") throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
			if (version.length > MAX_LENGTH) throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
			debug("SemVer", version, options);
			this.options = options;
			this.loose = !!options.loose;
			this.includePrerelease = !!options.includePrerelease;
			const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
			if (!m) throw new TypeError(`Invalid Version: ${version}`);
			this.raw = version;
			this.major = +m[1];
			this.minor = +m[2];
			this.patch = +m[3];
			if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError("Invalid major version");
			if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError("Invalid minor version");
			if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError("Invalid patch version");
			if (!m[4]) this.prerelease = [];
			else this.prerelease = m[4].split(".").map((id) => {
				if (/^[0-9]+$/.test(id)) {
					const num = +id;
					if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
				}
				return id;
			});
			this.build = m[5] ? m[5].split(".") : [];
			this.format();
		}
		format() {
			this.version = `${this.major}.${this.minor}.${this.patch}`;
			if (this.prerelease.length) this.version += `-${this.prerelease.join(".")}`;
			return this.version;
		}
		toString() {
			return this.version;
		}
		compare(other) {
			debug("SemVer.compare", this.version, this.options, other);
			if (!(other instanceof SemVer)) {
				if (typeof other === "string" && other === this.version) return 0;
				other = new SemVer(other, this.options);
			}
			if (other.version === this.version) return 0;
			return this.compareMain(other) || this.comparePre(other);
		}
		compareMain(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			if (this.major < other.major) return -1;
			if (this.major > other.major) return 1;
			if (this.minor < other.minor) return -1;
			if (this.minor > other.minor) return 1;
			if (this.patch < other.patch) return -1;
			if (this.patch > other.patch) return 1;
			return 0;
		}
		comparePre(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			if (this.prerelease.length && !other.prerelease.length) return -1;
			else if (!this.prerelease.length && other.prerelease.length) return 1;
			else if (!this.prerelease.length && !other.prerelease.length) return 0;
			let i = 0;
			do {
				const a = this.prerelease[i];
				const b = other.prerelease[i];
				debug("prerelease compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		compareBuild(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			let i = 0;
			do {
				const a = this.build[i];
				const b = other.build[i];
				debug("build compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		inc(release, identifier, identifierBase) {
			if (release.startsWith("pre")) {
				if (!identifier && identifierBase === false) throw new Error("invalid increment argument: identifier is empty");
				if (identifier) {
					const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
					if (!match || match[1] !== identifier) throw new Error(`invalid identifier: ${identifier}`);
				}
			}
			switch (release) {
				case "premajor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor = 0;
					this.major++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "preminor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "prepatch":
					this.prerelease.length = 0;
					this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "prerelease":
					if (this.prerelease.length === 0) this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "release":
					if (this.prerelease.length === 0) throw new Error(`version ${this.raw} is not a prerelease`);
					this.prerelease.length = 0;
					break;
				case "major":
					if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) this.major++;
					this.minor = 0;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "minor":
					if (this.patch !== 0 || this.prerelease.length === 0) this.minor++;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "patch":
					if (this.prerelease.length === 0) this.patch++;
					this.prerelease = [];
					break;
				case "pre": {
					const base = Number(identifierBase) ? 1 : 0;
					if (this.prerelease.length === 0) this.prerelease = [base];
					else {
						let i = this.prerelease.length;
						while (--i >= 0) if (typeof this.prerelease[i] === "number") {
							this.prerelease[i]++;
							i = -2;
						}
						if (i === -1) {
							if (identifier === this.prerelease.join(".") && identifierBase === false) throw new Error("invalid increment argument: identifier already exists");
							this.prerelease.push(base);
						}
					}
					if (identifier) {
						let prerelease = [identifier, base];
						if (identifierBase === false) prerelease = [identifier];
						if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
							if (isNaN(this.prerelease[1])) this.prerelease = prerelease;
						} else this.prerelease = prerelease;
					}
					break;
				}
				default: throw new Error(`invalid increment argument: ${release}`);
			}
			this.raw = this.format();
			if (this.build.length) this.raw += `+${this.build.join(".")}`;
			return this;
		}
	};
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var parse = (version, options, throwErrors = false) => {
		if (version instanceof SemVer) return version;
		try {
			return new SemVer(version, options);
		} catch (er) {
			if (!throwErrors) return null;
			throw er;
		}
	};
	module.exports = parse;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/valid.js
var require_valid$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var parse = require_parse();
	var valid = (version, options) => {
		const v = parse(version, options);
		return v ? v.version : null;
	};
	module.exports = valid;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/clean.js
var require_clean = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var parse = require_parse();
	var clean = (version, options) => {
		const s = parse(version.trim().replace(/^[=v]+/, ""), options);
		return s ? s.version : null;
	};
	module.exports = clean;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/inc.js
var require_inc = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var inc = (version, release, options, identifier, identifierBase) => {
		if (typeof options === "string") {
			identifierBase = identifier;
			identifier = options;
			options = void 0;
		}
		try {
			return new SemVer(version instanceof SemVer ? version.version : version, options).inc(release, identifier, identifierBase).version;
		} catch (er) {
			return null;
		}
	};
	module.exports = inc;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/diff.js
var require_diff = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var parse = require_parse();
	var diff = (version1, version2) => {
		const v1 = parse(version1, null, true);
		const v2 = parse(version2, null, true);
		const comparison = v1.compare(v2);
		if (comparison === 0) return null;
		const v1Higher = comparison > 0;
		const highVersion = v1Higher ? v1 : v2;
		const lowVersion = v1Higher ? v2 : v1;
		const highHasPre = !!highVersion.prerelease.length;
		if (!!lowVersion.prerelease.length && !highHasPre) {
			if (!lowVersion.patch && !lowVersion.minor) return "major";
			if (lowVersion.compareMain(highVersion) === 0) {
				if (lowVersion.minor && !lowVersion.patch) return "minor";
				return "patch";
			}
		}
		const prefix = highHasPre ? "pre" : "";
		if (v1.major !== v2.major) return prefix + "major";
		if (v1.minor !== v2.minor) return prefix + "minor";
		if (v1.patch !== v2.patch) return prefix + "patch";
		return "prerelease";
	};
	module.exports = diff;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/major.js
var require_major = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var major = (a, loose) => new SemVer(a, loose).major;
	module.exports = major;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/minor.js
var require_minor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var minor = (a, loose) => new SemVer(a, loose).minor;
	module.exports = minor;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/patch.js
var require_patch = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var patch = (a, loose) => new SemVer(a, loose).patch;
	module.exports = patch;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/prerelease.js
var require_prerelease = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var parse = require_parse();
	var prerelease = (version, options) => {
		const parsed = parse(version, options);
		return parsed && parsed.prerelease.length ? parsed.prerelease : null;
	};
	module.exports = prerelease;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/compare.js
var require_compare = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
	module.exports = compare;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/rcompare.js
var require_rcompare = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var rcompare = (a, b, loose) => compare(b, a, loose);
	module.exports = rcompare;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/compare-loose.js
var require_compare_loose = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var compareLoose = (a, b) => compare(a, b, true);
	module.exports = compareLoose;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/compare-build.js
var require_compare_build = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var compareBuild = (a, b, loose) => {
		const versionA = new SemVer(a, loose);
		const versionB = new SemVer(b, loose);
		return versionA.compare(versionB) || versionA.compareBuild(versionB);
	};
	module.exports = compareBuild;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/sort.js
var require_sort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compareBuild = require_compare_build();
	var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
	module.exports = sort;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/rsort.js
var require_rsort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compareBuild = require_compare_build();
	var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
	module.exports = rsort;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/gt.js
var require_gt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var gt = (a, b, loose) => compare(a, b, loose) > 0;
	module.exports = gt;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/lt.js
var require_lt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var lt = (a, b, loose) => compare(a, b, loose) < 0;
	module.exports = lt;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/eq.js
var require_eq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var eq = (a, b, loose) => compare(a, b, loose) === 0;
	module.exports = eq;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/neq.js
var require_neq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var neq = (a, b, loose) => compare(a, b, loose) !== 0;
	module.exports = neq;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/gte.js
var require_gte = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var gte = (a, b, loose) => compare(a, b, loose) >= 0;
	module.exports = gte;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/lte.js
var require_lte = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var compare = require_compare();
	var lte = (a, b, loose) => compare(a, b, loose) <= 0;
	module.exports = lte;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/cmp.js
var require_cmp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var eq = require_eq();
	var neq = require_neq();
	var gt = require_gt();
	var gte = require_gte();
	var lt = require_lt();
	var lte = require_lte();
	var cmp = (a, op, b, loose) => {
		switch (op) {
			case "===":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a === b;
			case "!==":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a !== b;
			case "":
			case "=":
			case "==": return eq(a, b, loose);
			case "!=": return neq(a, b, loose);
			case ">": return gt(a, b, loose);
			case ">=": return gte(a, b, loose);
			case "<": return lt(a, b, loose);
			case "<=": return lte(a, b, loose);
			default: throw new TypeError(`Invalid operator: ${op}`);
		}
	};
	module.exports = cmp;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/coerce.js
var require_coerce = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var parse = require_parse();
	var { safeRe: re, t } = require_re();
	var coerce = (version, options) => {
		if (version instanceof SemVer) return version;
		if (typeof version === "number") version = String(version);
		if (typeof version !== "string") return null;
		options = options || {};
		let match = null;
		if (!options.rtl) match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
		else {
			const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
			let next;
			while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
				if (!match || next.index + next[0].length !== match.index + match[0].length) match = next;
				coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
			}
			coerceRtlRegex.lastIndex = -1;
		}
		if (match === null) return null;
		const major = match[2];
		return parse(`${major}.${match[3] || "0"}.${match[4] || "0"}${options.includePrerelease && match[5] ? `-${match[5]}` : ""}${options.includePrerelease && match[6] ? `+${match[6]}` : ""}`, options);
	};
	module.exports = coerce;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/internal/lrucache.js
var require_lrucache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var LRUCache = class {
		constructor() {
			this.max = 1e3;
			this.map = /* @__PURE__ */ new Map();
		}
		get(key) {
			const value = this.map.get(key);
			if (value === void 0) return;
			else {
				this.map.delete(key);
				this.map.set(key, value);
				return value;
			}
		}
		delete(key) {
			return this.map.delete(key);
		}
		set(key, value) {
			if (!this.delete(key) && value !== void 0) {
				if (this.map.size >= this.max) {
					const firstKey = this.map.keys().next().value;
					this.delete(firstKey);
				}
				this.map.set(key, value);
			}
			return this;
		}
	};
	module.exports = LRUCache;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/classes/range.js
var require_range = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SPACE_CHARACTERS = /\s+/g;
	module.exports = class Range {
		constructor(range, options) {
			options = parseOptions(options);
			if (range instanceof Range) {
				if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) return range;
				else return new Range(range.raw, options);
			}
			if (range instanceof Comparator) {
				this.raw = range.value;
				this.set = [[range]];
				this.formatted = void 0;
				return this;
			}
			this.options = options;
			this.loose = !!options.loose;
			this.includePrerelease = !!options.includePrerelease;
			this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
			this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
			if (!this.set.length) throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
			if (this.set.length > 1) {
				const first = this.set[0];
				this.set = this.set.filter((c) => !isNullSet(c[0]));
				if (this.set.length === 0) this.set = [first];
				else if (this.set.length > 1) {
					for (const c of this.set) if (c.length === 1 && isAny(c[0])) {
						this.set = [c];
						break;
					}
				}
			}
			this.formatted = void 0;
		}
		get range() {
			if (this.formatted === void 0) {
				this.formatted = "";
				for (let i = 0; i < this.set.length; i++) {
					if (i > 0) this.formatted += "||";
					const comps = this.set[i];
					for (let k = 0; k < comps.length; k++) {
						if (k > 0) this.formatted += " ";
						this.formatted += comps[k].toString().trim();
					}
				}
			}
			return this.formatted;
		}
		format() {
			return this.range;
		}
		toString() {
			return this.range;
		}
		parseRange(range) {
			const memoKey = ((this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE)) + ":" + range;
			const cached = cache.get(memoKey);
			if (cached) return cached;
			const loose = this.options.loose;
			const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
			range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
			debug("hyphen replace", range);
			range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
			debug("comparator trim", range);
			range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
			debug("tilde trim", range);
			range = range.replace(re[t.CARETTRIM], caretTrimReplace);
			debug("caret trim", range);
			let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
			if (loose) rangeList = rangeList.filter((comp) => {
				debug("loose invalid filter", comp, this.options);
				return !!comp.match(re[t.COMPARATORLOOSE]);
			});
			debug("range list", rangeList);
			const rangeMap = /* @__PURE__ */ new Map();
			const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
			for (const comp of comparators) {
				if (isNullSet(comp)) return [comp];
				rangeMap.set(comp.value, comp);
			}
			if (rangeMap.size > 1 && rangeMap.has("")) rangeMap.delete("");
			const result = [...rangeMap.values()];
			cache.set(memoKey, result);
			return result;
		}
		intersects(range, options) {
			if (!(range instanceof Range)) throw new TypeError("a Range is required");
			return this.set.some((thisComparators) => {
				return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
					return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
						return rangeComparators.every((rangeComparator) => {
							return thisComparator.intersects(rangeComparator, options);
						});
					});
				});
			});
		}
		test(version) {
			if (!version) return false;
			if (typeof version === "string") try {
				version = new SemVer(version, this.options);
			} catch (er) {
				return false;
			}
			for (let i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return true;
			return false;
		}
	};
	var cache = new (require_lrucache())();
	var parseOptions = require_parse_options();
	var Comparator = require_comparator();
	var debug = require_debug();
	var SemVer = require_semver$1();
	var { safeRe: re, t, comparatorTrimReplace, tildeTrimReplace, caretTrimReplace } = require_re();
	var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
	var isNullSet = (c) => c.value === "<0.0.0-0";
	var isAny = (c) => c.value === "";
	var isSatisfiable = (comparators, options) => {
		let result = true;
		const remainingComparators = comparators.slice();
		let testComparator = remainingComparators.pop();
		while (result && remainingComparators.length) {
			result = remainingComparators.every((otherComparator) => {
				return testComparator.intersects(otherComparator, options);
			});
			testComparator = remainingComparators.pop();
		}
		return result;
	};
	var parseComparator = (comp, options) => {
		comp = comp.replace(re[t.BUILD], "");
		debug("comp", comp, options);
		comp = replaceCarets(comp, options);
		debug("caret", comp);
		comp = replaceTildes(comp, options);
		debug("tildes", comp);
		comp = replaceXRanges(comp, options);
		debug("xrange", comp);
		comp = replaceStars(comp, options);
		debug("stars", comp);
		return comp;
	};
	var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
	var replaceTildes = (comp, options) => {
		return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
	};
	var replaceTilde = (comp, options) => {
		const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
		return comp.replace(r, (_, M, m, p, pr) => {
			debug("tilde", comp, _, M, m, p, pr);
			let ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
			else if (isX(p)) ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
			else if (pr) {
				debug("replaceTilde pr", pr);
				ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
			} else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
			debug("tilde return", ret);
			return ret;
		});
	};
	var replaceCarets = (comp, options) => {
		return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
	};
	var replaceCaret = (comp, options) => {
		debug("caret", comp, options);
		const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
		const z = options.includePrerelease ? "-0" : "";
		return comp.replace(r, (_, M, m, p, pr) => {
			debug("caret", comp, _, M, m, p, pr);
			let ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
			else if (isX(p)) {
				if (M === "0") ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
				else ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
			} else if (pr) {
				debug("replaceCaret pr", pr);
				if (M === "0") {
					if (m === "0") ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
					else ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
				} else ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
			} else {
				debug("no pr");
				if (M === "0") {
					if (m === "0") ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
					else ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
				} else ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
			}
			debug("caret return", ret);
			return ret;
		});
	};
	var replaceXRanges = (comp, options) => {
		debug("replaceXRanges", comp, options);
		return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
	};
	var replaceXRange = (comp, options) => {
		comp = comp.trim();
		const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
		return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
			debug("xRange", comp, ret, gtlt, M, m, p, pr);
			const xM = isX(M);
			const xm = xM || isX(m);
			const xp = xm || isX(p);
			const anyX = xp;
			if (gtlt === "=" && anyX) gtlt = "";
			pr = options.includePrerelease ? "-0" : "";
			if (xM) {
				if (gtlt === ">" || gtlt === "<") ret = "<0.0.0-0";
				else ret = "*";
			} else if (gtlt && anyX) {
				if (xm) m = 0;
				p = 0;
				if (gtlt === ">") {
					gtlt = ">=";
					if (xm) {
						M = +M + 1;
						m = 0;
						p = 0;
					} else {
						m = +m + 1;
						p = 0;
					}
				} else if (gtlt === "<=") {
					gtlt = "<";
					if (xm) M = +M + 1;
					else m = +m + 1;
				}
				if (gtlt === "<") pr = "-0";
				ret = `${gtlt + M}.${m}.${p}${pr}`;
			} else if (xm) ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
			else if (xp) ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
			debug("xRange return", ret);
			return ret;
		});
	};
	var replaceStars = (comp, options) => {
		debug("replaceStars", comp, options);
		return comp.trim().replace(re[t.STAR], "");
	};
	var replaceGTE0 = (comp, options) => {
		debug("replaceGTE0", comp, options);
		return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
	};
	var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
		if (isX(fM)) from = "";
		else if (isX(fm)) from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
		else if (isX(fp)) from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
		else if (fpr) from = `>=${from}`;
		else from = `>=${from}${incPr ? "-0" : ""}`;
		if (isX(tM)) to = "";
		else if (isX(tm)) to = `<${+tM + 1}.0.0-0`;
		else if (isX(tp)) to = `<${tM}.${+tm + 1}.0-0`;
		else if (tpr) to = `<=${tM}.${tm}.${tp}-${tpr}`;
		else if (incPr) to = `<${tM}.${tm}.${+tp + 1}-0`;
		else to = `<=${to}`;
		return `${from} ${to}`.trim();
	};
	var testSet = (set, version, options) => {
		for (let i = 0; i < set.length; i++) if (!set[i].test(version)) return false;
		if (version.prerelease.length && !options.includePrerelease) {
			for (let i = 0; i < set.length; i++) {
				debug(set[i].semver);
				if (set[i].semver === Comparator.ANY) continue;
				if (set[i].semver.prerelease.length > 0) {
					const allowed = set[i].semver;
					if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) return true;
				}
			}
			return false;
		}
		return true;
	};
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/classes/comparator.js
var require_comparator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ANY = Symbol("SemVer ANY");
	module.exports = class Comparator {
		static get ANY() {
			return ANY;
		}
		constructor(comp, options) {
			options = parseOptions(options);
			if (comp instanceof Comparator) {
				if (comp.loose === !!options.loose) return comp;
				else comp = comp.value;
			}
			comp = comp.trim().split(/\s+/).join(" ");
			debug("comparator", comp, options);
			this.options = options;
			this.loose = !!options.loose;
			this.parse(comp);
			if (this.semver === ANY) this.value = "";
			else this.value = this.operator + this.semver.version;
			debug("comp", this);
		}
		parse(comp) {
			const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
			const m = comp.match(r);
			if (!m) throw new TypeError(`Invalid comparator: ${comp}`);
			this.operator = m[1] !== void 0 ? m[1] : "";
			if (this.operator === "=") this.operator = "";
			if (!m[2]) this.semver = ANY;
			else this.semver = new SemVer(m[2], this.options.loose);
		}
		toString() {
			return this.value;
		}
		test(version) {
			debug("Comparator.test", version, this.options.loose);
			if (this.semver === ANY || version === ANY) return true;
			if (typeof version === "string") try {
				version = new SemVer(version, this.options);
			} catch (er) {
				return false;
			}
			return cmp(version, this.operator, this.semver, this.options);
		}
		intersects(comp, options) {
			if (!(comp instanceof Comparator)) throw new TypeError("a Comparator is required");
			if (this.operator === "") {
				if (this.value === "") return true;
				return new Range(comp.value, options).test(this.value);
			} else if (comp.operator === "") {
				if (comp.value === "") return true;
				return new Range(this.value, options).test(comp.semver);
			}
			options = parseOptions(options);
			if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) return false;
			if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) return false;
			if (this.operator.startsWith(">") && comp.operator.startsWith(">")) return true;
			if (this.operator.startsWith("<") && comp.operator.startsWith("<")) return true;
			if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) return true;
			if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) return true;
			if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) return true;
			return false;
		}
	};
	var parseOptions = require_parse_options();
	var { safeRe: re, t } = require_re();
	var cmp = require_cmp();
	var debug = require_debug();
	var SemVer = require_semver$1();
	var Range = require_range();
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/functions/satisfies.js
var require_satisfies = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Range = require_range();
	var satisfies = (version, range, options) => {
		try {
			range = new Range(range, options);
		} catch (er) {
			return false;
		}
		return range.test(version);
	};
	module.exports = satisfies;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/to-comparators.js
var require_to_comparators = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Range = require_range();
	var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
	module.exports = toComparators;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var Range = require_range();
	var maxSatisfying = (versions, range, options) => {
		let max = null;
		let maxSV = null;
		let rangeObj = null;
		try {
			rangeObj = new Range(range, options);
		} catch (er) {
			return null;
		}
		versions.forEach((v) => {
			if (rangeObj.test(v)) {
				if (!max || maxSV.compare(v) === -1) {
					max = v;
					maxSV = new SemVer(max, options);
				}
			}
		});
		return max;
	};
	module.exports = maxSatisfying;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var Range = require_range();
	var minSatisfying = (versions, range, options) => {
		let min = null;
		let minSV = null;
		let rangeObj = null;
		try {
			rangeObj = new Range(range, options);
		} catch (er) {
			return null;
		}
		versions.forEach((v) => {
			if (rangeObj.test(v)) {
				if (!min || minSV.compare(v) === 1) {
					min = v;
					minSV = new SemVer(min, options);
				}
			}
		});
		return min;
	};
	module.exports = minSatisfying;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/min-version.js
var require_min_version = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var Range = require_range();
	var gt = require_gt();
	var minVersion = (range, loose) => {
		range = new Range(range, loose);
		let minver = new SemVer("0.0.0");
		if (range.test(minver)) return minver;
		minver = new SemVer("0.0.0-0");
		if (range.test(minver)) return minver;
		minver = null;
		for (let i = 0; i < range.set.length; ++i) {
			const comparators = range.set[i];
			let setMin = null;
			comparators.forEach((comparator) => {
				const compver = new SemVer(comparator.semver.version);
				switch (comparator.operator) {
					case ">":
						if (compver.prerelease.length === 0) compver.patch++;
						else compver.prerelease.push(0);
						compver.raw = compver.format();
					case "":
					case ">=":
						if (!setMin || gt(compver, setMin)) setMin = compver;
						break;
					case "<":
					case "<=": break;
					/* istanbul ignore next */
					default: throw new Error(`Unexpected operation: ${comparator.operator}`);
				}
			});
			if (setMin && (!minver || gt(minver, setMin))) minver = setMin;
		}
		if (minver && range.test(minver)) return minver;
		return null;
	};
	module.exports = minVersion;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/valid.js
var require_valid = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Range = require_range();
	var validRange = (range, options) => {
		try {
			return new Range(range, options).range || "*";
		} catch (er) {
			return null;
		}
	};
	module.exports = validRange;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/outside.js
var require_outside = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var SemVer = require_semver$1();
	var Comparator = require_comparator();
	var { ANY } = Comparator;
	var Range = require_range();
	var satisfies = require_satisfies();
	var gt = require_gt();
	var lt = require_lt();
	var lte = require_lte();
	var gte = require_gte();
	var outside = (version, range, hilo, options) => {
		version = new SemVer(version, options);
		range = new Range(range, options);
		let gtfn, ltefn, ltfn, comp, ecomp;
		switch (hilo) {
			case ">":
				gtfn = gt;
				ltefn = lte;
				ltfn = lt;
				comp = ">";
				ecomp = ">=";
				break;
			case "<":
				gtfn = lt;
				ltefn = gte;
				ltfn = gt;
				comp = "<";
				ecomp = "<=";
				break;
			default: throw new TypeError("Must provide a hilo val of \"<\" or \">\"");
		}
		if (satisfies(version, range, options)) return false;
		for (let i = 0; i < range.set.length; ++i) {
			const comparators = range.set[i];
			let high = null;
			let low = null;
			comparators.forEach((comparator) => {
				if (comparator.semver === ANY) comparator = new Comparator(">=0.0.0");
				high = high || comparator;
				low = low || comparator;
				if (gtfn(comparator.semver, high.semver, options)) high = comparator;
				else if (ltfn(comparator.semver, low.semver, options)) low = comparator;
			});
			if (high.operator === comp || high.operator === ecomp) return false;
			if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) return false;
			else if (low.operator === ecomp && ltfn(version, low.semver)) return false;
		}
		return true;
	};
	module.exports = outside;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/gtr.js
var require_gtr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var outside = require_outside();
	var gtr = (version, range, options) => outside(version, range, ">", options);
	module.exports = gtr;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/ltr.js
var require_ltr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var outside = require_outside();
	var ltr = (version, range, options) => outside(version, range, "<", options);
	module.exports = ltr;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/intersects.js
var require_intersects = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Range = require_range();
	var intersects = (r1, r2, options) => {
		r1 = new Range(r1, options);
		r2 = new Range(r2, options);
		return r1.intersects(r2, options);
	};
	module.exports = intersects;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/simplify.js
var require_simplify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var satisfies = require_satisfies();
	var compare = require_compare();
	module.exports = (versions, range, options) => {
		const set = [];
		let first = null;
		let prev = null;
		const v = versions.sort((a, b) => compare(a, b, options));
		for (const version of v) if (satisfies(version, range, options)) {
			prev = version;
			if (!first) first = version;
		} else {
			if (prev) set.push([first, prev]);
			prev = null;
			first = null;
		}
		if (first) set.push([first, null]);
		const ranges = [];
		for (const [min, max] of set) if (min === max) ranges.push(min);
		else if (!max && min === v[0]) ranges.push("*");
		else if (!max) ranges.push(`>=${min}`);
		else if (min === v[0]) ranges.push(`<=${max}`);
		else ranges.push(`${min} - ${max}`);
		const simplified = ranges.join(" || ");
		const original = typeof range.raw === "string" ? range.raw : String(range);
		return simplified.length < original.length ? simplified : range;
	};
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/ranges/subset.js
var require_subset = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Range = require_range();
	var Comparator = require_comparator();
	var { ANY } = Comparator;
	var satisfies = require_satisfies();
	var compare = require_compare();
	var subset = (sub, dom, options = {}) => {
		if (sub === dom) return true;
		sub = new Range(sub, options);
		dom = new Range(dom, options);
		let sawNonNull = false;
		OUTER: for (const simpleSub of sub.set) {
			for (const simpleDom of dom.set) {
				const isSub = simpleSubset(simpleSub, simpleDom, options);
				sawNonNull = sawNonNull || isSub !== null;
				if (isSub) continue OUTER;
			}
			if (sawNonNull) return false;
		}
		return true;
	};
	var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
	var minimumVersion = [new Comparator(">=0.0.0")];
	var simpleSubset = (sub, dom, options) => {
		if (sub === dom) return true;
		if (sub.length === 1 && sub[0].semver === ANY) {
			if (dom.length === 1 && dom[0].semver === ANY) return true;
			else if (options.includePrerelease) sub = minimumVersionWithPreRelease;
			else sub = minimumVersion;
		}
		if (dom.length === 1 && dom[0].semver === ANY) {
			if (options.includePrerelease) return true;
			else dom = minimumVersion;
		}
		const eqSet = /* @__PURE__ */ new Set();
		let gt, lt;
		for (const c of sub) if (c.operator === ">" || c.operator === ">=") gt = higherGT(gt, c, options);
		else if (c.operator === "<" || c.operator === "<=") lt = lowerLT(lt, c, options);
		else eqSet.add(c.semver);
		if (eqSet.size > 1) return null;
		let gtltComp;
		if (gt && lt) {
			gtltComp = compare(gt.semver, lt.semver, options);
			if (gtltComp > 0) return null;
			else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) return null;
		}
		for (const eq of eqSet) {
			if (gt && !satisfies(eq, String(gt), options)) return null;
			if (lt && !satisfies(eq, String(lt), options)) return null;
			for (const c of dom) if (!satisfies(eq, String(c), options)) return false;
			return true;
		}
		let higher, lower;
		let hasDomLT, hasDomGT;
		let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
		let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
		if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) needDomLTPre = false;
		for (const c of dom) {
			hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
			hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
			if (gt) {
				if (needDomGTPre) {
					if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) needDomGTPre = false;
				}
				if (c.operator === ">" || c.operator === ">=") {
					higher = higherGT(gt, c, options);
					if (higher === c && higher !== gt) return false;
				} else if (gt.operator === ">=" && !satisfies(gt.semver, String(c), options)) return false;
			}
			if (lt) {
				if (needDomLTPre) {
					if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) needDomLTPre = false;
				}
				if (c.operator === "<" || c.operator === "<=") {
					lower = lowerLT(lt, c, options);
					if (lower === c && lower !== lt) return false;
				} else if (lt.operator === "<=" && !satisfies(lt.semver, String(c), options)) return false;
			}
			if (!c.operator && (lt || gt) && gtltComp !== 0) return false;
		}
		if (gt && hasDomLT && !lt && gtltComp !== 0) return false;
		if (lt && hasDomGT && !gt && gtltComp !== 0) return false;
		if (needDomGTPre || needDomLTPre) return false;
		return true;
	};
	var higherGT = (a, b, options) => {
		if (!a) return b;
		const comp = compare(a.semver, b.semver, options);
		return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
	};
	var lowerLT = (a, b, options) => {
		if (!a) return b;
		const comp = compare(a.semver, b.semver, options);
		return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
	};
	module.exports = subset;
}));
//#endregion
//#region node_modules/electron-updater/node_modules/semver/index.js
var require_semver = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internalRe = require_re();
	var constants = require_constants();
	var SemVer = require_semver$1();
	var identifiers = require_identifiers();
	module.exports = {
		parse: require_parse(),
		valid: require_valid$1(),
		clean: require_clean(),
		inc: require_inc(),
		diff: require_diff(),
		major: require_major(),
		minor: require_minor(),
		patch: require_patch(),
		prerelease: require_prerelease(),
		compare: require_compare(),
		rcompare: require_rcompare(),
		compareLoose: require_compare_loose(),
		compareBuild: require_compare_build(),
		sort: require_sort(),
		rsort: require_rsort(),
		gt: require_gt(),
		lt: require_lt(),
		eq: require_eq(),
		neq: require_neq(),
		gte: require_gte(),
		lte: require_lte(),
		cmp: require_cmp(),
		coerce: require_coerce(),
		Comparator: require_comparator(),
		Range: require_range(),
		satisfies: require_satisfies(),
		toComparators: require_to_comparators(),
		maxSatisfying: require_max_satisfying(),
		minSatisfying: require_min_satisfying(),
		minVersion: require_min_version(),
		validRange: require_valid(),
		outside: require_outside(),
		gtr: require_gtr(),
		ltr: require_ltr(),
		intersects: require_intersects(),
		simplifyRange: require_simplify(),
		subset: require_subset(),
		SemVer,
		re: internalRe.re,
		src: internalRe.src,
		tokens: internalRe.t,
		SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
		RELEASE_TYPES: constants.RELEASE_TYPES,
		compareIdentifiers: identifiers.compareIdentifiers,
		rcompareIdentifiers: identifiers.rcompareIdentifiers
	};
}));
//#endregion
//#region node_modules/lodash.isequal/index.js
var require_lodash_isequal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = "__lodash_hash_undefined__";
	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;
	var COMPARE_UNORDERED_FLAG = 2;
	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;
	/** `Object#toString` result references. */
	var argsTag = "[object Arguments]";
	var arrayTag = "[object Array]";
	var asyncTag = "[object AsyncFunction]";
	var boolTag = "[object Boolean]";
	var dateTag = "[object Date]";
	var errorTag = "[object Error]";
	var funcTag = "[object Function]";
	var genTag = "[object GeneratorFunction]";
	var mapTag = "[object Map]";
	var numberTag = "[object Number]";
	var nullTag = "[object Null]";
	var objectTag = "[object Object]";
	var promiseTag = "[object Promise]";
	var proxyTag = "[object Proxy]";
	var regexpTag = "[object RegExp]";
	var setTag = "[object Set]";
	var stringTag = "[object String]";
	var symbolTag = "[object Symbol]";
	var undefinedTag = "[object Undefined]";
	var weakMapTag = "[object WeakMap]";
	var arrayBufferTag = "[object ArrayBuffer]";
	var dataViewTag = "[object DataView]";
	var float32Tag = "[object Float32Array]";
	var float64Tag = "[object Float64Array]";
	var int8Tag = "[object Int8Array]";
	var int16Tag = "[object Int16Array]";
	var int32Tag = "[object Int32Array]";
	var uint8Tag = "[object Uint8Array]";
	var uint8ClampedTag = "[object Uint8ClampedArray]";
	var uint16Tag = "[object Uint16Array]";
	var uint32Tag = "[object Uint32Array]";
	/**
	* Used to match `RegExp`
	* [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	*/
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;
	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;
	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
	/** Detect free variable `self`. */
	var freeSelf = typeof self == "object" && self && self.Object === Object && self;
	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function("return this")();
	/** Detect free variable `exports`. */
	var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
	/** Detect free variable `module`. */
	var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
	/** Detect the popular CommonJS extension `module.exports`. */
	var moduleExports = freeModule && freeModule.exports === freeExports;
	/** Detect free variable `process` from Node.js. */
	var freeProcess = moduleExports && freeGlobal.process;
	/** Used to access faster Node.js helpers. */
	var nodeUtil = function() {
		try {
			return freeProcess && freeProcess.binding && freeProcess.binding("util");
		} catch (e) {}
	}();
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
	/**
	* A specialized version of `_.filter` for arrays without support for
	* iteratee shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} predicate The function invoked per iteration.
	* @returns {Array} Returns the new filtered array.
	*/
	function arrayFilter(array, predicate) {
		var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
		while (++index < length) {
			var value = array[index];
			if (predicate(value, index, array)) result[resIndex++] = value;
		}
		return result;
	}
	/**
	* Appends the elements of `values` to `array`.
	*
	* @private
	* @param {Array} array The array to modify.
	* @param {Array} values The values to append.
	* @returns {Array} Returns `array`.
	*/
	function arrayPush(array, values) {
		var index = -1, length = values.length, offset = array.length;
		while (++index < length) array[offset + index] = values[index];
		return array;
	}
	/**
	* A specialized version of `_.some` for arrays without support for iteratee
	* shorthands.
	*
	* @private
	* @param {Array} [array] The array to iterate over.
	* @param {Function} predicate The function invoked per iteration.
	* @returns {boolean} Returns `true` if any element passes the predicate check,
	*  else `false`.
	*/
	function arraySome(array, predicate) {
		var index = -1, length = array == null ? 0 : array.length;
		while (++index < length) if (predicate(array[index], index, array)) return true;
		return false;
	}
	/**
	* The base implementation of `_.times` without support for iteratee shorthands
	* or max array length checks.
	*
	* @private
	* @param {number} n The number of times to invoke `iteratee`.
	* @param {Function} iteratee The function invoked per iteration.
	* @returns {Array} Returns the array of results.
	*/
	function baseTimes(n, iteratee) {
		var index = -1, result = Array(n);
		while (++index < n) result[index] = iteratee(index);
		return result;
	}
	/**
	* The base implementation of `_.unary` without support for storing metadata.
	*
	* @private
	* @param {Function} func The function to cap arguments for.
	* @returns {Function} Returns the new capped function.
	*/
	function baseUnary(func) {
		return function(value) {
			return func(value);
		};
	}
	/**
	* Checks if a `cache` value for `key` exists.
	*
	* @private
	* @param {Object} cache The cache to query.
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function cacheHas(cache, key) {
		return cache.has(key);
	}
	/**
	* Gets the value at `key` of `object`.
	*
	* @private
	* @param {Object} [object] The object to query.
	* @param {string} key The key of the property to get.
	* @returns {*} Returns the property value.
	*/
	function getValue(object, key) {
		return object == null ? void 0 : object[key];
	}
	/**
	* Converts `map` to its key-value pairs.
	*
	* @private
	* @param {Object} map The map to convert.
	* @returns {Array} Returns the key-value pairs.
	*/
	function mapToArray(map) {
		var index = -1, result = Array(map.size);
		map.forEach(function(value, key) {
			result[++index] = [key, value];
		});
		return result;
	}
	/**
	* Creates a unary function that invokes `func` with its argument transformed.
	*
	* @private
	* @param {Function} func The function to wrap.
	* @param {Function} transform The argument transform.
	* @returns {Function} Returns the new function.
	*/
	function overArg(func, transform) {
		return function(arg) {
			return func(transform(arg));
		};
	}
	/**
	* Converts `set` to an array of its values.
	*
	* @private
	* @param {Object} set The set to convert.
	* @returns {Array} Returns the values.
	*/
	function setToArray(set) {
		var index = -1, result = Array(set.size);
		set.forEach(function(value) {
			result[++index] = value;
		});
		return result;
	}
	/** Used for built-in method references. */
	var arrayProto = Array.prototype;
	var funcProto = Function.prototype;
	var objectProto = Object.prototype;
	/** Used to detect overreaching core-js shims. */
	var coreJsData = root["__core-js_shared__"];
	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;
	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;
	/** Used to detect methods masquerading as native. */
	var maskSrcKey = function() {
		var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
		return uid ? "Symbol(src)_1." + uid : "";
	}();
	/**
	* Used to resolve the
	* [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	* of values.
	*/
	var nativeObjectToString = objectProto.toString;
	/** Used to detect if a method is native. */
	var reIsNative = RegExp("^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
	/** Built-in value references. */
	var Buffer = moduleExports ? root.Buffer : void 0;
	var Symbol = root.Symbol;
	var Uint8Array = root.Uint8Array;
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;
	var splice = arrayProto.splice;
	var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
	var nativeGetSymbols = Object.getOwnPropertySymbols;
	var nativeIsBuffer = Buffer ? Buffer.isBuffer : void 0;
	var nativeKeys = overArg(Object.keys, Object);
	var DataView = getNative(root, "DataView");
	var Map = getNative(root, "Map");
	var Promise = getNative(root, "Promise");
	var Set = getNative(root, "Set");
	var WeakMap = getNative(root, "WeakMap");
	var nativeCreate = getNative(Object, "create");
	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView);
	var mapCtorString = toSource(Map);
	var promiseCtorString = toSource(Promise);
	var setCtorString = toSource(Set);
	var weakMapCtorString = toSource(WeakMap);
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : void 0;
	var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
	/**
	* Creates a hash object.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function Hash(entries) {
		var index = -1, length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	/**
	* Removes all key-value entries from the hash.
	*
	* @private
	* @name clear
	* @memberOf Hash
	*/
	function hashClear() {
		this.__data__ = nativeCreate ? nativeCreate(null) : {};
		this.size = 0;
	}
	/**
	* Removes `key` and its value from the hash.
	*
	* @private
	* @name delete
	* @memberOf Hash
	* @param {Object} hash The hash to modify.
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function hashDelete(key) {
		var result = this.has(key) && delete this.__data__[key];
		this.size -= result ? 1 : 0;
		return result;
	}
	/**
	* Gets the hash value for `key`.
	*
	* @private
	* @name get
	* @memberOf Hash
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function hashGet(key) {
		var data = this.__data__;
		if (nativeCreate) {
			var result = data[key];
			return result === HASH_UNDEFINED ? void 0 : result;
		}
		return hasOwnProperty.call(data, key) ? data[key] : void 0;
	}
	/**
	* Checks if a hash value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf Hash
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function hashHas(key) {
		var data = this.__data__;
		return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
	}
	/**
	* Sets the hash `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf Hash
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the hash instance.
	*/
	function hashSet(key, value) {
		var data = this.__data__;
		this.size += this.has(key) ? 0 : 1;
		data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
		return this;
	}
	Hash.prototype.clear = hashClear;
	Hash.prototype["delete"] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;
	/**
	* Creates an list cache object.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function ListCache(entries) {
		var index = -1, length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	/**
	* Removes all key-value entries from the list cache.
	*
	* @private
	* @name clear
	* @memberOf ListCache
	*/
	function listCacheClear() {
		this.__data__ = [];
		this.size = 0;
	}
	/**
	* Removes `key` and its value from the list cache.
	*
	* @private
	* @name delete
	* @memberOf ListCache
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function listCacheDelete(key) {
		var data = this.__data__, index = assocIndexOf(data, key);
		if (index < 0) return false;
		if (index == data.length - 1) data.pop();
		else splice.call(data, index, 1);
		--this.size;
		return true;
	}
	/**
	* Gets the list cache value for `key`.
	*
	* @private
	* @name get
	* @memberOf ListCache
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function listCacheGet(key) {
		var data = this.__data__, index = assocIndexOf(data, key);
		return index < 0 ? void 0 : data[index][1];
	}
	/**
	* Checks if a list cache value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf ListCache
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function listCacheHas(key) {
		return assocIndexOf(this.__data__, key) > -1;
	}
	/**
	* Sets the list cache `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf ListCache
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the list cache instance.
	*/
	function listCacheSet(key, value) {
		var data = this.__data__, index = assocIndexOf(data, key);
		if (index < 0) {
			++this.size;
			data.push([key, value]);
		} else data[index][1] = value;
		return this;
	}
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype["delete"] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;
	/**
	* Creates a map cache object to store key-value pairs.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function MapCache(entries) {
		var index = -1, length = entries == null ? 0 : entries.length;
		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}
	/**
	* Removes all key-value entries from the map.
	*
	* @private
	* @name clear
	* @memberOf MapCache
	*/
	function mapCacheClear() {
		this.size = 0;
		this.__data__ = {
			"hash": new Hash(),
			"map": new (Map || ListCache)(),
			"string": new Hash()
		};
	}
	/**
	* Removes `key` and its value from the map.
	*
	* @private
	* @name delete
	* @memberOf MapCache
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function mapCacheDelete(key) {
		var result = getMapData(this, key)["delete"](key);
		this.size -= result ? 1 : 0;
		return result;
	}
	/**
	* Gets the map value for `key`.
	*
	* @private
	* @name get
	* @memberOf MapCache
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function mapCacheGet(key) {
		return getMapData(this, key).get(key);
	}
	/**
	* Checks if a map value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf MapCache
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function mapCacheHas(key) {
		return getMapData(this, key).has(key);
	}
	/**
	* Sets the map `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf MapCache
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the map cache instance.
	*/
	function mapCacheSet(key, value) {
		var data = getMapData(this, key), size = data.size;
		data.set(key, value);
		this.size += data.size == size ? 0 : 1;
		return this;
	}
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype["delete"] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;
	/**
	*
	* Creates an array cache object to store unique values.
	*
	* @private
	* @constructor
	* @param {Array} [values] The values to cache.
	*/
	function SetCache(values) {
		var index = -1, length = values == null ? 0 : values.length;
		this.__data__ = new MapCache();
		while (++index < length) this.add(values[index]);
	}
	/**
	* Adds `value` to the array cache.
	*
	* @private
	* @name add
	* @memberOf SetCache
	* @alias push
	* @param {*} value The value to cache.
	* @returns {Object} Returns the cache instance.
	*/
	function setCacheAdd(value) {
		this.__data__.set(value, HASH_UNDEFINED);
		return this;
	}
	/**
	* Checks if `value` is in the array cache.
	*
	* @private
	* @name has
	* @memberOf SetCache
	* @param {*} value The value to search for.
	* @returns {number} Returns `true` if `value` is found, else `false`.
	*/
	function setCacheHas(value) {
		return this.__data__.has(value);
	}
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;
	/**
	* Creates a stack cache object to store key-value pairs.
	*
	* @private
	* @constructor
	* @param {Array} [entries] The key-value pairs to cache.
	*/
	function Stack(entries) {
		var data = this.__data__ = new ListCache(entries);
		this.size = data.size;
	}
	/**
	* Removes all key-value entries from the stack.
	*
	* @private
	* @name clear
	* @memberOf Stack
	*/
	function stackClear() {
		this.__data__ = new ListCache();
		this.size = 0;
	}
	/**
	* Removes `key` and its value from the stack.
	*
	* @private
	* @name delete
	* @memberOf Stack
	* @param {string} key The key of the value to remove.
	* @returns {boolean} Returns `true` if the entry was removed, else `false`.
	*/
	function stackDelete(key) {
		var data = this.__data__, result = data["delete"](key);
		this.size = data.size;
		return result;
	}
	/**
	* Gets the stack value for `key`.
	*
	* @private
	* @name get
	* @memberOf Stack
	* @param {string} key The key of the value to get.
	* @returns {*} Returns the entry value.
	*/
	function stackGet(key) {
		return this.__data__.get(key);
	}
	/**
	* Checks if a stack value for `key` exists.
	*
	* @private
	* @name has
	* @memberOf Stack
	* @param {string} key The key of the entry to check.
	* @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	*/
	function stackHas(key) {
		return this.__data__.has(key);
	}
	/**
	* Sets the stack `key` to `value`.
	*
	* @private
	* @name set
	* @memberOf Stack
	* @param {string} key The key of the value to set.
	* @param {*} value The value to set.
	* @returns {Object} Returns the stack cache instance.
	*/
	function stackSet(key, value) {
		var data = this.__data__;
		if (data instanceof ListCache) {
			var pairs = data.__data__;
			if (!Map || pairs.length < 199) {
				pairs.push([key, value]);
				this.size = ++data.size;
				return this;
			}
			data = this.__data__ = new MapCache(pairs);
		}
		data.set(key, value);
		this.size = data.size;
		return this;
	}
	Stack.prototype.clear = stackClear;
	Stack.prototype["delete"] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;
	/**
	* Creates an array of the enumerable property names of the array-like `value`.
	*
	* @private
	* @param {*} value The value to query.
	* @param {boolean} inherited Specify returning inherited property names.
	* @returns {Array} Returns the array of property names.
	*/
	function arrayLikeKeys(value, inherited) {
		var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
		for (var key in value) if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex(key, length)))) result.push(key);
		return result;
	}
	/**
	* Gets the index at which the `key` is found in `array` of key-value pairs.
	*
	* @private
	* @param {Array} array The array to inspect.
	* @param {*} key The key to search for.
	* @returns {number} Returns the index of the matched value, else `-1`.
	*/
	function assocIndexOf(array, key) {
		var length = array.length;
		while (length--) if (eq(array[length][0], key)) return length;
		return -1;
	}
	/**
	* The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	* `keysFunc` and `symbolsFunc` to get the enumerable property names and
	* symbols of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @param {Function} keysFunc The function to get the keys of `object`.
	* @param {Function} symbolsFunc The function to get the symbols of `object`.
	* @returns {Array} Returns the array of property names and symbols.
	*/
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
		var result = keysFunc(object);
		return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}
	/**
	* The base implementation of `getTag` without fallbacks for buggy environments.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the `toStringTag`.
	*/
	function baseGetTag(value) {
		if (value == null) return value === void 0 ? undefinedTag : nullTag;
		return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
	}
	/**
	* The base implementation of `_.isArguments`.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is an `arguments` object,
	*/
	function baseIsArguments(value) {
		return isObjectLike(value) && baseGetTag(value) == argsTag;
	}
	/**
	* The base implementation of `_.isEqual` which supports partial comparisons
	* and tracks traversed objects.
	*
	* @private
	* @param {*} value The value to compare.
	* @param {*} other The other value to compare.
	* @param {boolean} bitmask The bitmask flags.
	*  1 - Unordered comparison
	*  2 - Partial comparison
	* @param {Function} [customizer] The function to customize comparisons.
	* @param {Object} [stack] Tracks traversed `value` and `other` objects.
	* @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	*/
	function baseIsEqual(value, other, bitmask, customizer, stack) {
		if (value === other) return true;
		if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) return value !== value && other !== other;
		return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
	}
	/**
	* A specialized version of `baseIsEqual` for arrays and objects which performs
	* deep comparisons and tracks traversed objects enabling objects with circular
	* references to be compared.
	*
	* @private
	* @param {Object} object The object to compare.
	* @param {Object} other The other object to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} [stack] Tracks traversed `object` and `other` objects.
	* @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	*/
	function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
		var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
		objTag = objTag == argsTag ? objectTag : objTag;
		othTag = othTag == argsTag ? objectTag : othTag;
		var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
		if (isSameTag && isBuffer(object)) {
			if (!isBuffer(other)) return false;
			objIsArr = true;
			objIsObj = false;
		}
		if (isSameTag && !objIsObj) {
			stack || (stack = new Stack());
			return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
		}
		if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
			var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
			if (objIsWrapped || othIsWrapped) {
				var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
				stack || (stack = new Stack());
				return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
			}
		}
		if (!isSameTag) return false;
		stack || (stack = new Stack());
		return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
	}
	/**
	* The base implementation of `_.isNative` without bad shim checks.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a native function,
	*  else `false`.
	*/
	function baseIsNative(value) {
		if (!isObject(value) || isMasked(value)) return false;
		return (isFunction(value) ? reIsNative : reIsHostCtor).test(toSource(value));
	}
	/**
	* The base implementation of `_.isTypedArray` without Node.js optimizations.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	*/
	function baseIsTypedArray(value) {
		return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}
	/**
	* The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names.
	*/
	function baseKeys(object) {
		if (!isPrototype(object)) return nativeKeys(object);
		var result = [];
		for (var key in Object(object)) if (hasOwnProperty.call(object, key) && key != "constructor") result.push(key);
		return result;
	}
	/**
	* A specialized version of `baseIsEqualDeep` for arrays with support for
	* partial deep comparisons.
	*
	* @private
	* @param {Array} array The array to compare.
	* @param {Array} other The other array to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} stack Tracks traversed `array` and `other` objects.
	* @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	*/
	function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
		var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
		if (arrLength != othLength && !(isPartial && othLength > arrLength)) return false;
		var stacked = stack.get(array);
		if (stacked && stack.get(other)) return stacked == other;
		var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
		stack.set(array, other);
		stack.set(other, array);
		while (++index < arrLength) {
			var arrValue = array[index], othValue = other[index];
			if (customizer) var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
			if (compared !== void 0) {
				if (compared) continue;
				result = false;
				break;
			}
			if (seen) {
				if (!arraySome(other, function(othValue, othIndex) {
					if (!cacheHas(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) return seen.push(othIndex);
				})) {
					result = false;
					break;
				}
			} else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
				result = false;
				break;
			}
		}
		stack["delete"](array);
		stack["delete"](other);
		return result;
	}
	/**
	* A specialized version of `baseIsEqualDeep` for comparing objects of
	* the same `toStringTag`.
	*
	* **Note:** This function only supports comparing values with tags of
	* `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	*
	* @private
	* @param {Object} object The object to compare.
	* @param {Object} other The other object to compare.
	* @param {string} tag The `toStringTag` of the objects to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} stack Tracks traversed `object` and `other` objects.
	* @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	*/
	function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
		switch (tag) {
			case dataViewTag:
				if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) return false;
				object = object.buffer;
				other = other.buffer;
			case arrayBufferTag:
				if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) return false;
				return true;
			case boolTag:
			case dateTag:
			case numberTag: return eq(+object, +other);
			case errorTag: return object.name == other.name && object.message == other.message;
			case regexpTag:
			case stringTag: return object == other + "";
			case mapTag: var convert = mapToArray;
			case setTag:
				var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
				convert || (convert = setToArray);
				if (object.size != other.size && !isPartial) return false;
				var stacked = stack.get(object);
				if (stacked) return stacked == other;
				bitmask |= COMPARE_UNORDERED_FLAG;
				stack.set(object, other);
				var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
				stack["delete"](object);
				return result;
			case symbolTag: if (symbolValueOf) return symbolValueOf.call(object) == symbolValueOf.call(other);
		}
		return false;
	}
	/**
	* A specialized version of `baseIsEqualDeep` for objects with support for
	* partial deep comparisons.
	*
	* @private
	* @param {Object} object The object to compare.
	* @param {Object} other The other object to compare.
	* @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	* @param {Function} customizer The function to customize comparisons.
	* @param {Function} equalFunc The function to determine equivalents of values.
	* @param {Object} stack Tracks traversed `object` and `other` objects.
	* @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	*/
	function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
		var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length;
		if (objLength != getAllKeys(other).length && !isPartial) return false;
		var index = objLength;
		while (index--) {
			var key = objProps[index];
			if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) return false;
		}
		var stacked = stack.get(object);
		if (stacked && stack.get(other)) return stacked == other;
		var result = true;
		stack.set(object, other);
		stack.set(other, object);
		var skipCtor = isPartial;
		while (++index < objLength) {
			key = objProps[index];
			var objValue = object[key], othValue = other[key];
			if (customizer) var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
			if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
				result = false;
				break;
			}
			skipCtor || (skipCtor = key == "constructor");
		}
		if (result && !skipCtor) {
			var objCtor = object.constructor, othCtor = other.constructor;
			if (objCtor != othCtor && "constructor" in object && "constructor" in other && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) result = false;
		}
		stack["delete"](object);
		stack["delete"](other);
		return result;
	}
	/**
	* Creates an array of own enumerable property names and symbols of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names and symbols.
	*/
	function getAllKeys(object) {
		return baseGetAllKeys(object, keys, getSymbols);
	}
	/**
	* Gets the data for `map`.
	*
	* @private
	* @param {Object} map The map to query.
	* @param {string} key The reference key.
	* @returns {*} Returns the map data.
	*/
	function getMapData(map, key) {
		var data = map.__data__;
		return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
	}
	/**
	* Gets the native function at `key` of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @param {string} key The key of the method to get.
	* @returns {*} Returns the function if it's native, else `undefined`.
	*/
	function getNative(object, key) {
		var value = getValue(object, key);
		return baseIsNative(value) ? value : void 0;
	}
	/**
	* A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the raw `toStringTag`.
	*/
	function getRawTag(value) {
		var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
		try {
			value[symToStringTag] = void 0;
			var unmasked = true;
		} catch (e) {}
		var result = nativeObjectToString.call(value);
		if (unmasked) {
			if (isOwn) value[symToStringTag] = tag;
			else delete value[symToStringTag];
		}
		return result;
	}
	/**
	* Creates an array of the own enumerable symbols of `object`.
	*
	* @private
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of symbols.
	*/
	var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
		if (object == null) return [];
		object = Object(object);
		return arrayFilter(nativeGetSymbols(object), function(symbol) {
			return propertyIsEnumerable.call(object, symbol);
		});
	};
	/**
	* Gets the `toStringTag` of `value`.
	*
	* @private
	* @param {*} value The value to query.
	* @returns {string} Returns the `toStringTag`.
	*/
	var getTag = baseGetTag;
	if (DataView && getTag(new DataView(/* @__PURE__ */ new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise && getTag(Promise.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) getTag = function(value) {
		var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
		if (ctorString) switch (ctorString) {
			case dataViewCtorString: return dataViewTag;
			case mapCtorString: return mapTag;
			case promiseCtorString: return promiseTag;
			case setCtorString: return setTag;
			case weakMapCtorString: return weakMapTag;
		}
		return result;
	};
	/**
	* Checks if `value` is a valid array-like index.
	*
	* @private
	* @param {*} value The value to check.
	* @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	* @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	*/
	function isIndex(value, length) {
		length = length == null ? MAX_SAFE_INTEGER : length;
		return !!length && (typeof value == "number" || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
	}
	/**
	* Checks if `value` is suitable for use as unique object key.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	*/
	function isKeyable(value) {
		var type = typeof value;
		return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
	}
	/**
	* Checks if `func` has its source masked.
	*
	* @private
	* @param {Function} func The function to check.
	* @returns {boolean} Returns `true` if `func` is masked, else `false`.
	*/
	function isMasked(func) {
		return !!maskSrcKey && maskSrcKey in func;
	}
	/**
	* Checks if `value` is likely a prototype object.
	*
	* @private
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	*/
	function isPrototype(value) {
		var Ctor = value && value.constructor;
		return value === (typeof Ctor == "function" && Ctor.prototype || objectProto);
	}
	/**
	* Converts `value` to a string using `Object.prototype.toString`.
	*
	* @private
	* @param {*} value The value to convert.
	* @returns {string} Returns the converted string.
	*/
	function objectToString(value) {
		return nativeObjectToString.call(value);
	}
	/**
	* Converts `func` to its source code.
	*
	* @private
	* @param {Function} func The function to convert.
	* @returns {string} Returns the source code.
	*/
	function toSource(func) {
		if (func != null) {
			try {
				return funcToString.call(func);
			} catch (e) {}
			try {
				return func + "";
			} catch (e) {}
		}
		return "";
	}
	/**
	* Performs a
	* [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	* comparison between two values to determine if they are equivalent.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to compare.
	* @param {*} other The other value to compare.
	* @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	* @example
	*
	* var object = { 'a': 1 };
	* var other = { 'a': 1 };
	*
	* _.eq(object, object);
	* // => true
	*
	* _.eq(object, other);
	* // => false
	*
	* _.eq('a', 'a');
	* // => true
	*
	* _.eq('a', Object('a'));
	* // => false
	*
	* _.eq(NaN, NaN);
	* // => true
	*/
	function eq(value, other) {
		return value === other || value !== value && other !== other;
	}
	/**
	* Checks if `value` is likely an `arguments` object.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is an `arguments` object,
	*  else `false`.
	* @example
	*
	* _.isArguments(function() { return arguments; }());
	* // => true
	*
	* _.isArguments([1, 2, 3]);
	* // => false
	*/
	var isArguments = baseIsArguments(function() {
		return arguments;
	}()) ? baseIsArguments : function(value) {
		return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
	};
	/**
	* Checks if `value` is classified as an `Array` object.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is an array, else `false`.
	* @example
	*
	* _.isArray([1, 2, 3]);
	* // => true
	*
	* _.isArray(document.body.children);
	* // => false
	*
	* _.isArray('abc');
	* // => false
	*
	* _.isArray(_.noop);
	* // => false
	*/
	var isArray = Array.isArray;
	/**
	* Checks if `value` is array-like. A value is considered array-like if it's
	* not a function and has a `value.length` that's an integer greater than or
	* equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	* @example
	*
	* _.isArrayLike([1, 2, 3]);
	* // => true
	*
	* _.isArrayLike(document.body.children);
	* // => true
	*
	* _.isArrayLike('abc');
	* // => true
	*
	* _.isArrayLike(_.noop);
	* // => false
	*/
	function isArrayLike(value) {
		return value != null && isLength(value.length) && !isFunction(value);
	}
	/**
	* Checks if `value` is a buffer.
	*
	* @static
	* @memberOf _
	* @since 4.3.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
	* @example
	*
	* _.isBuffer(new Buffer(2));
	* // => true
	*
	* _.isBuffer(new Uint8Array(2));
	* // => false
	*/
	var isBuffer = nativeIsBuffer || stubFalse;
	/**
	* Performs a deep comparison between two values to determine if they are
	* equivalent.
	*
	* **Note:** This method supports comparing arrays, array buffers, booleans,
	* date objects, error objects, maps, numbers, `Object` objects, regexes,
	* sets, strings, symbols, and typed arrays. `Object` objects are compared
	* by their own, not inherited, enumerable properties. Functions and DOM
	* nodes are compared by strict equality, i.e. `===`.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to compare.
	* @param {*} other The other value to compare.
	* @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	* @example
	*
	* var object = { 'a': 1 };
	* var other = { 'a': 1 };
	*
	* _.isEqual(object, other);
	* // => true
	*
	* object === other;
	* // => false
	*/
	function isEqual(value, other) {
		return baseIsEqual(value, other);
	}
	/**
	* Checks if `value` is classified as a `Function` object.
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a function, else `false`.
	* @example
	*
	* _.isFunction(_);
	* // => true
	*
	* _.isFunction(/abc/);
	* // => false
	*/
	function isFunction(value) {
		if (!isObject(value)) return false;
		var tag = baseGetTag(value);
		return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}
	/**
	* Checks if `value` is a valid array-like length.
	*
	* **Note:** This method is loosely based on
	* [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	* @example
	*
	* _.isLength(3);
	* // => true
	*
	* _.isLength(Number.MIN_VALUE);
	* // => false
	*
	* _.isLength(Infinity);
	* // => false
	*
	* _.isLength('3');
	* // => false
	*/
	function isLength(value) {
		return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}
	/**
	* Checks if `value` is the
	* [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	* of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	*
	* @static
	* @memberOf _
	* @since 0.1.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is an object, else `false`.
	* @example
	*
	* _.isObject({});
	* // => true
	*
	* _.isObject([1, 2, 3]);
	* // => true
	*
	* _.isObject(_.noop);
	* // => true
	*
	* _.isObject(null);
	* // => false
	*/
	function isObject(value) {
		var type = typeof value;
		return value != null && (type == "object" || type == "function");
	}
	/**
	* Checks if `value` is object-like. A value is object-like if it's not `null`
	* and has a `typeof` result of "object".
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	* @example
	*
	* _.isObjectLike({});
	* // => true
	*
	* _.isObjectLike([1, 2, 3]);
	* // => true
	*
	* _.isObjectLike(_.noop);
	* // => false
	*
	* _.isObjectLike(null);
	* // => false
	*/
	function isObjectLike(value) {
		return value != null && typeof value == "object";
	}
	/**
	* Checks if `value` is classified as a typed array.
	*
	* @static
	* @memberOf _
	* @since 3.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	* @example
	*
	* _.isTypedArray(new Uint8Array);
	* // => true
	*
	* _.isTypedArray([]);
	* // => false
	*/
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
	/**
	* Creates an array of the own enumerable property names of `object`.
	*
	* **Note:** Non-object values are coerced to objects. See the
	* [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	* for more details.
	*
	* @static
	* @since 0.1.0
	* @memberOf _
	* @category Object
	* @param {Object} object The object to query.
	* @returns {Array} Returns the array of property names.
	* @example
	*
	* function Foo() {
	*   this.a = 1;
	*   this.b = 2;
	* }
	*
	* Foo.prototype.c = 3;
	*
	* _.keys(new Foo);
	* // => ['a', 'b'] (iteration order is not guaranteed)
	*
	* _.keys('hi');
	* // => ['0', '1']
	*/
	function keys(object) {
		return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}
	/**
	* This method returns a new empty array.
	*
	* @static
	* @memberOf _
	* @since 4.13.0
	* @category Util
	* @returns {Array} Returns the new empty array.
	* @example
	*
	* var arrays = _.times(2, _.stubArray);
	*
	* console.log(arrays);
	* // => [[], []]
	*
	* console.log(arrays[0] === arrays[1]);
	* // => false
	*/
	function stubArray() {
		return [];
	}
	/**
	* This method returns `false`.
	*
	* @static
	* @memberOf _
	* @since 4.13.0
	* @category Util
	* @returns {boolean} Returns `false`.
	* @example
	*
	* _.times(2, _.stubFalse);
	* // => [false, false]
	*/
	function stubFalse() {
		return false;
	}
	module.exports = isEqual;
}));
//#endregion
//#region node_modules/electron-updater/out/DownloadedUpdateHelper.js
var require_DownloadedUpdateHelper = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DownloadedUpdateHelper = void 0;
	exports.createTempUpdateFile = createTempUpdateFile;
	var crypto_1$2 = __require("crypto");
	var fs_1$4 = __require("fs");
	var isEqual = require_lodash_isequal();
	var fs_extra_1 = require_lib();
	var path$11 = __require("path");
	/** @private **/
	var DownloadedUpdateHelper = class {
		constructor(cacheDir) {
			this.cacheDir = cacheDir;
			this._file = null;
			this._packageFile = null;
			this.versionInfo = null;
			this.fileInfo = null;
			this._downloadedFileInfo = null;
		}
		get downloadedFileInfo() {
			return this._downloadedFileInfo;
		}
		get file() {
			return this._file;
		}
		get packageFile() {
			return this._packageFile;
		}
		get cacheDirForPendingUpdate() {
			return path$11.join(this.cacheDir, "pending");
		}
		async validateDownloadedPath(updateFile, updateInfo, fileInfo, logger) {
			if (this.versionInfo != null && this.file === updateFile && this.fileInfo != null) {
				if (isEqual(this.versionInfo, updateInfo) && isEqual(this.fileInfo.info, fileInfo.info) && await (0, fs_extra_1.pathExists)(updateFile)) return updateFile;
				else return null;
			}
			const cachedUpdateFile = await this.getValidCachedUpdateFile(fileInfo, logger);
			if (cachedUpdateFile === null) return null;
			logger.info(`Update has already been downloaded to ${updateFile}).`);
			this._file = cachedUpdateFile;
			return cachedUpdateFile;
		}
		async setDownloadedFile(downloadedFile, packageFile, versionInfo, fileInfo, updateFileName, isSaveCache) {
			this._file = downloadedFile;
			this._packageFile = packageFile;
			this.versionInfo = versionInfo;
			this.fileInfo = fileInfo;
			this._downloadedFileInfo = {
				fileName: updateFileName,
				sha512: fileInfo.info.sha512,
				isAdminRightsRequired: fileInfo.info.isAdminRightsRequired === true
			};
			if (isSaveCache) await (0, fs_extra_1.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
		}
		async clear() {
			this._file = null;
			this._packageFile = null;
			this.versionInfo = null;
			this.fileInfo = null;
			await this.cleanCacheDirForPendingUpdate();
		}
		async cleanCacheDirForPendingUpdate() {
			try {
				await (0, fs_extra_1.emptyDir)(this.cacheDirForPendingUpdate);
			} catch (_ignore) {}
		}
		/**
		* Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
		* @param fileInfo
		* @param logger
		*/
		async getValidCachedUpdateFile(fileInfo, logger) {
			const updateInfoFilePath = this.getUpdateInfoFile();
			if (!await (0, fs_extra_1.pathExists)(updateInfoFilePath)) return null;
			let cachedInfo;
			try {
				cachedInfo = await (0, fs_extra_1.readJson)(updateInfoFilePath);
			} catch (error) {
				let message = `No cached update info available`;
				if (error.code !== "ENOENT") {
					await this.cleanCacheDirForPendingUpdate();
					message += ` (error on read: ${error.message})`;
				}
				logger.info(message);
				return null;
			}
			if (!((cachedInfo === null || cachedInfo === void 0 ? void 0 : cachedInfo.fileName) !== null)) {
				logger.warn(`Cached update info is corrupted: no fileName, directory for cached update will be cleaned`);
				await this.cleanCacheDirForPendingUpdate();
				return null;
			}
			if (fileInfo.info.sha512 !== cachedInfo.sha512) {
				logger.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${cachedInfo.sha512}, expected: ${fileInfo.info.sha512}. Directory for cached update will be cleaned`);
				await this.cleanCacheDirForPendingUpdate();
				return null;
			}
			const updateFile = path$11.join(this.cacheDirForPendingUpdate, cachedInfo.fileName);
			if (!await (0, fs_extra_1.pathExists)(updateFile)) {
				logger.info("Cached update file doesn't exist");
				return null;
			}
			const sha512 = await hashFile(updateFile);
			if (fileInfo.info.sha512 !== sha512) {
				logger.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${sha512}, expected: ${fileInfo.info.sha512}`);
				await this.cleanCacheDirForPendingUpdate();
				return null;
			}
			this._downloadedFileInfo = cachedInfo;
			return updateFile;
		}
		getUpdateInfoFile() {
			return path$11.join(this.cacheDirForPendingUpdate, "update-info.json");
		}
	};
	exports.DownloadedUpdateHelper = DownloadedUpdateHelper;
	function hashFile(file, algorithm = "sha512", encoding = "base64", options) {
		return new Promise((resolve, reject) => {
			const hash = (0, crypto_1$2.createHash)(algorithm);
			hash.on("error", reject).setEncoding(encoding);
			(0, fs_1$4.createReadStream)(file, {
				...options,
				highWaterMark: 1048576
			}).on("error", reject).on("end", () => {
				hash.end();
				resolve(hash.read());
			}).pipe(hash, { end: false });
		});
	}
	async function createTempUpdateFile(name, cacheDir, log) {
		let nameCounter = 0;
		let result = path$11.join(cacheDir, name);
		for (let i = 0; i < 3; i++) try {
			await (0, fs_extra_1.unlink)(result);
			return result;
		} catch (e) {
			if (e.code === "ENOENT") return result;
			log.warn(`Error on remove temp update file: ${e}`);
			result = path$11.join(cacheDir, `${nameCounter++}-${name}`);
		}
		return result;
	}
}));
//#endregion
//#region node_modules/electron-updater/out/AppAdapter.js
var require_AppAdapter = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getAppCacheDir = getAppCacheDir;
	var path$10 = __require("path");
	var os_1$1 = __require("os");
	function getAppCacheDir() {
		const homedir = (0, os_1$1.homedir)();
		let result;
		if (process.platform === "win32") result = process.env["LOCALAPPDATA"] || path$10.join(homedir, "AppData", "Local");
		else if (process.platform === "darwin") result = path$10.join(homedir, "Library", "Caches");
		else result = process.env["XDG_CACHE_HOME"] || path$10.join(homedir, ".cache");
		return result;
	}
}));
//#endregion
//#region node_modules/electron-updater/out/ElectronAppAdapter.js
var require_ElectronAppAdapter = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ElectronAppAdapter = void 0;
	var path$9 = __require("path");
	var AppAdapter_1 = require_AppAdapter();
	var ElectronAppAdapter = class {
		constructor(app = __require("electron").app) {
			this.app = app;
		}
		whenReady() {
			return this.app.whenReady();
		}
		get version() {
			return this.app.getVersion();
		}
		get name() {
			return this.app.getName();
		}
		get isPackaged() {
			return this.app.isPackaged === true;
		}
		get appUpdateConfigPath() {
			return this.isPackaged ? path$9.join(process.resourcesPath, "app-update.yml") : path$9.join(this.app.getAppPath(), "dev-app-update.yml");
		}
		get userDataPath() {
			return this.app.getPath("userData");
		}
		get baseCachePath() {
			return (0, AppAdapter_1.getAppCacheDir)();
		}
		quit() {
			this.app.quit();
		}
		relaunch() {
			this.app.relaunch();
		}
		onQuit(handler) {
			this.app.once("quit", (_, exitCode) => handler(exitCode));
		}
	};
	exports.ElectronAppAdapter = ElectronAppAdapter;
}));
//#endregion
//#region node_modules/electron-updater/out/electronHttpExecutor.js
var require_electronHttpExecutor = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ElectronHttpExecutor = exports.NET_SESSION_NAME = void 0;
	exports.getNetSession = getNetSession;
	var builder_util_runtime_1 = require_out();
	exports.NET_SESSION_NAME = "electron-updater";
	function getNetSession() {
		return __require("electron").session.fromPartition(exports.NET_SESSION_NAME, { cache: false });
	}
	var ElectronHttpExecutor = class extends builder_util_runtime_1.HttpExecutor {
		constructor(proxyLoginCallback) {
			super();
			this.proxyLoginCallback = proxyLoginCallback;
			this.cachedSession = null;
		}
		async download(url, destination, options) {
			return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
				const requestOptions = {
					headers: options.headers || void 0,
					redirect: "manual"
				};
				(0, builder_util_runtime_1.configureRequestUrl)(url, requestOptions);
				(0, builder_util_runtime_1.configureRequestOptions)(requestOptions);
				this.doDownload(requestOptions, {
					destination,
					options,
					onCancel,
					callback: (error) => {
						if (error == null) resolve(destination);
						else reject(error);
					},
					responseHandler: null
				}, 0);
			});
		}
		createRequest(options, callback) {
			if (options.headers && options.headers.Host) {
				options.host = options.headers.Host;
				delete options.headers.Host;
			}
			if (this.cachedSession == null) this.cachedSession = getNetSession();
			const request = __require("electron").net.request({
				...options,
				session: this.cachedSession
			});
			request.on("response", callback);
			if (this.proxyLoginCallback != null) request.on("login", this.proxyLoginCallback);
			return request;
		}
		addRedirectHandlers(request, options, reject, redirectCount, handler) {
			request.on("redirect", (statusCode, method, redirectUrl) => {
				request.abort();
				if (redirectCount > this.maxRedirects) reject(this.createMaxRedirectError());
				else handler(builder_util_runtime_1.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options));
			});
		}
	};
	exports.ElectronHttpExecutor = ElectronHttpExecutor;
}));
//#endregion
//#region node_modules/electron-updater/out/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.newBaseUrl = newBaseUrl;
	exports.newUrlFromBase = newUrlFromBase;
	exports.getChannelFilename = getChannelFilename;
	var url_1$6 = __require("url");
	/** @internal */
	function newBaseUrl(url) {
		const result = new url_1$6.URL(url);
		if (!result.pathname.endsWith("/")) result.pathname += "/";
		return result;
	}
	function newUrlFromBase(pathname, baseUrl, addRandomQueryToAvoidCaching = false) {
		const result = new url_1$6.URL(pathname, baseUrl);
		const search = baseUrl.search;
		if (search != null && search.length !== 0) result.search = search;
		else if (addRandomQueryToAvoidCaching) result.search = `noCache=${Date.now().toString(32)}`;
		return result;
	}
	function getChannelFilename(channel) {
		return `${channel}.yml`;
	}
}));
//#endregion
//#region node_modules/lodash.escaperegexp/index.js
var require_lodash_escaperegexp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** `Object#toString` result references. */
	var symbolTag = "[object Symbol]";
	/**
	* Used to match `RegExp`
	* [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns).
	*/
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
	var reHasRegExpChar = RegExp(reRegExpChar.source);
	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
	/** Detect free variable `self`. */
	var freeSelf = typeof self == "object" && self && self.Object === Object && self;
	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function("return this")();
	/**
	* Used to resolve the
	* [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	* of values.
	*/
	var objectToString = Object.prototype.toString;
	/** Built-in value references. */
	var Symbol = root.Symbol;
	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : void 0;
	var symbolToString = symbolProto ? symbolProto.toString : void 0;
	/**
	* The base implementation of `_.toString` which doesn't convert nullish
	* values to empty strings.
	*
	* @private
	* @param {*} value The value to process.
	* @returns {string} Returns the string.
	*/
	function baseToString(value) {
		if (typeof value == "string") return value;
		if (isSymbol(value)) return symbolToString ? symbolToString.call(value) : "";
		var result = value + "";
		return result == "0" && 1 / value == -Infinity ? "-0" : result;
	}
	/**
	* Checks if `value` is object-like. A value is object-like if it's not `null`
	* and has a `typeof` result of "object".
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	* @example
	*
	* _.isObjectLike({});
	* // => true
	*
	* _.isObjectLike([1, 2, 3]);
	* // => true
	*
	* _.isObjectLike(_.noop);
	* // => false
	*
	* _.isObjectLike(null);
	* // => false
	*/
	function isObjectLike(value) {
		return !!value && typeof value == "object";
	}
	/**
	* Checks if `value` is classified as a `Symbol` primitive or object.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to check.
	* @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	* @example
	*
	* _.isSymbol(Symbol.iterator);
	* // => true
	*
	* _.isSymbol('abc');
	* // => false
	*/
	function isSymbol(value) {
		return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
	}
	/**
	* Converts `value` to a string. An empty string is returned for `null`
	* and `undefined` values. The sign of `-0` is preserved.
	*
	* @static
	* @memberOf _
	* @since 4.0.0
	* @category Lang
	* @param {*} value The value to process.
	* @returns {string} Returns the string.
	* @example
	*
	* _.toString(null);
	* // => ''
	*
	* _.toString(-0);
	* // => '-0'
	*
	* _.toString([1, 2, 3]);
	* // => '1,2,3'
	*/
	function toString(value) {
		return value == null ? "" : baseToString(value);
	}
	/**
	* Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
	* "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
	*
	* @static
	* @memberOf _
	* @since 3.0.0
	* @category String
	* @param {string} [string=''] The string to escape.
	* @returns {string} Returns the escaped string.
	* @example
	*
	* _.escapeRegExp('[lodash](https://lodash.com/)');
	* // => '\[lodash\]\(https://lodash\.com/\)'
	*/
	function escapeRegExp(string) {
		string = toString(string);
		return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
	}
	module.exports = escapeRegExp;
}));
//#endregion
//#region node_modules/electron-updater/out/providers/Provider.js
var require_Provider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Provider = void 0;
	exports.findFile = findFile;
	exports.parseUpdateInfo = parseUpdateInfo;
	exports.getFileList = getFileList;
	exports.resolveFiles = resolveFiles;
	var builder_util_runtime_1 = require_out();
	var js_yaml_1 = require_js_yaml();
	var url_1$5 = __require("url");
	var util_1 = require_util();
	var escapeRegExp = require_lodash_escaperegexp();
	var Provider = class {
		constructor(runtimeOptions) {
			this.runtimeOptions = runtimeOptions;
			this.requestHeaders = null;
			this.executor = runtimeOptions.executor;
		}
		getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl = null) {
			const newBlockMapUrl = (0, util_1.newUrlFromBase)(`${baseUrl.pathname}.blockmap`, baseUrl);
			return [(0, util_1.newUrlFromBase)(`${baseUrl.pathname.replace(new RegExp(escapeRegExp(newVersion), "g"), oldVersion)}.blockmap`, oldBlockMapFileBaseUrl ? new url_1$5.URL(oldBlockMapFileBaseUrl) : baseUrl), newBlockMapUrl];
		}
		get isUseMultipleRangeRequest() {
			return this.runtimeOptions.isUseMultipleRangeRequest !== false;
		}
		getChannelFilePrefix() {
			if (this.runtimeOptions.platform === "linux") {
				const arch = process.env["TEST_UPDATER_ARCH"] || process.arch;
				return "-linux" + (arch === "x64" ? "" : `-${arch}`);
			} else return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
		}
		getDefaultChannelName() {
			return this.getCustomChannelName("latest");
		}
		getCustomChannelName(channel) {
			return `${channel}${this.getChannelFilePrefix()}`;
		}
		get fileExtraDownloadHeaders() {
			return null;
		}
		setRequestHeaders(value) {
			this.requestHeaders = value;
		}
		/**
		* Method to perform API request only to resolve update info, but not to download update.
		*/
		httpRequest(url, headers, cancellationToken) {
			return this.executor.request(this.createRequestOptions(url, headers), cancellationToken);
		}
		createRequestOptions(url, headers) {
			const result = {};
			if (this.requestHeaders == null) {
				if (headers != null) result.headers = headers;
			} else result.headers = headers == null ? this.requestHeaders : {
				...this.requestHeaders,
				...headers
			};
			(0, builder_util_runtime_1.configureRequestUrl)(url, result);
			return result;
		}
	};
	exports.Provider = Provider;
	function findFile(files, extension, not) {
		var _a;
		if (files.length === 0) throw (0, builder_util_runtime_1.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
		const filteredFiles = files.filter((it) => it.url.pathname.toLowerCase().endsWith(`.${extension.toLowerCase()}`));
		const result = (_a = filteredFiles.find((it) => [it.url.pathname, it.info.url].some((n) => n.includes(process.arch)))) !== null && _a !== void 0 ? _a : filteredFiles.shift();
		if (result) return result;
		else if (not == null) return files[0];
		else return files.find((fileInfo) => !not.some((ext) => fileInfo.url.pathname.toLowerCase().endsWith(`.${ext.toLowerCase()}`)));
	}
	function parseUpdateInfo(rawData, channelFile, channelFileUrl) {
		if (rawData == null) throw (0, builder_util_runtime_1.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
		let result;
		try {
			result = (0, js_yaml_1.load)(rawData);
		} catch (e) {
			throw (0, builder_util_runtime_1.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}, rawData: ${rawData}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
		}
		return result;
	}
	function getFileList(updateInfo) {
		const files = updateInfo.files;
		if (files != null && files.length > 0) return files;
		if (updateInfo.path != null) return [{
			url: updateInfo.path,
			sha2: updateInfo.sha2,
			sha512: updateInfo.sha512
		}];
		else throw (0, builder_util_runtime_1.newError)(`No files provided: ${(0, builder_util_runtime_1.safeStringifyJson)(updateInfo)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
	}
	function resolveFiles(updateInfo, baseUrl, pathTransformer = (p) => p) {
		const result = getFileList(updateInfo).map((fileInfo) => {
			if (fileInfo.sha2 == null && fileInfo.sha512 == null) throw (0, builder_util_runtime_1.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, builder_util_runtime_1.safeStringifyJson)(fileInfo)}`, "ERR_UPDATER_NO_CHECKSUM");
			return {
				url: (0, util_1.newUrlFromBase)(pathTransformer(fileInfo.url), baseUrl),
				info: fileInfo
			};
		});
		const packages = updateInfo.packages;
		const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
		if (packageInfo != null) result[0].packageInfo = {
			...packageInfo,
			path: (0, util_1.newUrlFromBase)(pathTransformer(packageInfo.path), baseUrl).href
		};
		return result;
	}
}));
//#endregion
//#region node_modules/electron-updater/out/providers/GenericProvider.js
var require_GenericProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GenericProvider = void 0;
	var builder_util_runtime_1 = require_out();
	var util_1 = require_util();
	var Provider_1 = require_Provider();
	var GenericProvider = class extends Provider_1.Provider {
		constructor(configuration, updater, runtimeOptions) {
			super(runtimeOptions);
			this.configuration = configuration;
			this.updater = updater;
			this.baseUrl = (0, util_1.newBaseUrl)(this.configuration.url);
		}
		get channel() {
			const result = this.updater.channel || this.configuration.channel;
			return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
		}
		async getLatestVersion() {
			const channelFile = (0, util_1.getChannelFilename)(this.channel);
			const channelUrl = (0, util_1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
			for (let attemptNumber = 0;; attemptNumber++) try {
				return (0, Provider_1.parseUpdateInfo)(await this.httpRequest(channelUrl), channelFile, channelUrl);
			} catch (e) {
				if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) throw (0, builder_util_runtime_1.newError)(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
				else if (e.code === "ECONNREFUSED") {
					if (attemptNumber < 3) {
						await new Promise((resolve, reject) => {
							try {
								setTimeout(resolve, 1e3 * attemptNumber);
							} catch (e) {
								reject(e);
							}
						});
						continue;
					}
				}
				throw e;
			}
		}
		resolveFiles(updateInfo) {
			return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl);
		}
	};
	exports.GenericProvider = GenericProvider;
}));
//#endregion
//#region node_modules/electron-updater/out/providers/BitbucketProvider.js
var require_BitbucketProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BitbucketProvider = void 0;
	var builder_util_runtime_1 = require_out();
	var util_1 = require_util();
	var Provider_1 = require_Provider();
	var BitbucketProvider = class extends Provider_1.Provider {
		constructor(configuration, updater, runtimeOptions) {
			super({
				...runtimeOptions,
				isUseMultipleRangeRequest: false
			});
			this.configuration = configuration;
			this.updater = updater;
			const { owner, slug } = configuration;
			this.baseUrl = (0, util_1.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${owner}/${slug}/downloads`);
		}
		get channel() {
			return this.updater.channel || this.configuration.channel || "latest";
		}
		async getLatestVersion() {
			const cancellationToken = new builder_util_runtime_1.CancellationToken();
			const channelFile = (0, util_1.getChannelFilename)(this.getCustomChannelName(this.channel));
			const channelUrl = (0, util_1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
			try {
				const updateInfo = await this.httpRequest(channelUrl, void 0, cancellationToken);
				return (0, Provider_1.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
			} catch (e) {
				throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
			}
		}
		resolveFiles(updateInfo) {
			return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl);
		}
		toString() {
			const { owner, slug } = this.configuration;
			return `Bitbucket (owner: ${owner}, slug: ${slug}, channel: ${this.channel})`;
		}
	};
	exports.BitbucketProvider = BitbucketProvider;
}));
//#endregion
//#region node_modules/electron-updater/out/providers/GitHubProvider.js
var require_GitHubProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GitHubProvider = exports.BaseGitHubProvider = void 0;
	exports.computeReleaseNotes = computeReleaseNotes;
	var builder_util_runtime_1 = require_out();
	var semver = require_semver();
	var url_1$4 = __require("url");
	var util_1 = require_util();
	var Provider_1 = require_Provider();
	var hrefRegExp = /\/tag\/(v?[^/]+)$/;
	var BaseGitHubProvider = class extends Provider_1.Provider {
		constructor(options, defaultHost, runtimeOptions) {
			super({
				...runtimeOptions,
				isUseMultipleRangeRequest: false
			});
			this.options = options;
			this.baseUrl = (0, util_1.newBaseUrl)((0, builder_util_runtime_1.githubUrl)(options, defaultHost));
			const apiHost = defaultHost === "github.com" ? "api.github.com" : defaultHost;
			this.baseApiUrl = (0, util_1.newBaseUrl)((0, builder_util_runtime_1.githubUrl)(options, apiHost));
		}
		computeGithubBasePath(result) {
			const host = this.options.host;
			return host && !["github.com", "api.github.com"].includes(host) ? `/api/v3${result}` : result;
		}
	};
	exports.BaseGitHubProvider = BaseGitHubProvider;
	var GitHubProvider = class extends BaseGitHubProvider {
		constructor(options, updater, runtimeOptions) {
			super(options, "github.com", runtimeOptions);
			this.options = options;
			this.updater = updater;
		}
		get channel() {
			const result = this.updater.channel || this.options.channel;
			return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
		}
		async getLatestVersion() {
			var _a, _b, _c, _d, _e;
			const cancellationToken = new builder_util_runtime_1.CancellationToken();
			const feedXml = await this.httpRequest((0, util_1.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), { accept: "application/xml, application/atom+xml, text/xml, */*" }, cancellationToken);
			const feed = (0, builder_util_runtime_1.parseXml)(feedXml);
			let latestRelease = feed.element("entry", false, `No published versions on GitHub`);
			let tag = null;
			try {
				if (this.updater.allowPrerelease) {
					const currentChannel = ((_a = this.updater) === null || _a === void 0 ? void 0 : _a.channel) || ((_b = semver.prerelease(this.updater.currentVersion)) === null || _b === void 0 ? void 0 : _b[0]) || null;
					if (currentChannel === null) tag = hrefRegExp.exec(latestRelease.element("link").attribute("href"))[1];
					else for (const element of feed.getElements("entry")) {
						const hrefElement = hrefRegExp.exec(element.element("link").attribute("href"));
						if (hrefElement === null) continue;
						const hrefTag = hrefElement[1];
						if (!semver.valid(hrefTag)) continue;
						const hrefChannel = ((_c = semver.prerelease(hrefTag)) === null || _c === void 0 ? void 0 : _c[0]) || null;
						const shouldFetchVersion = !currentChannel || ["alpha", "beta"].includes(currentChannel);
						const isCustomChannel = hrefChannel !== null && !["alpha", "beta"].includes(String(hrefChannel));
						if (shouldFetchVersion && !isCustomChannel && !(currentChannel === "beta" && hrefChannel === "alpha")) {
							tag = hrefTag;
							latestRelease = element;
							break;
						}
						if (hrefChannel && hrefChannel === currentChannel) {
							tag = hrefTag;
							latestRelease = element;
							break;
						}
					}
				} else {
					tag = await this.getLatestTagName(cancellationToken);
					for (const element of feed.getElements("entry")) {
						const hrefMatch = hrefRegExp.exec(element.element("link").attribute("href"));
						if (hrefMatch == null) continue;
						if (hrefMatch[1] === tag) {
							latestRelease = element;
							break;
						}
					}
				}
			} catch (e) {
				throw (0, builder_util_runtime_1.newError)(`Cannot parse releases feed: ${e.stack || e.message},\nXML:\n${feedXml}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
			}
			if (tag == null) throw (0, builder_util_runtime_1.newError)(`No published versions on GitHub`, "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
			let rawData;
			let channelFile = "";
			let channelFileUrl = "";
			const fetchData = async (channelName) => {
				channelFile = (0, util_1.getChannelFilename)(channelName);
				channelFileUrl = (0, util_1.newUrlFromBase)(this.getBaseDownloadPath(String(tag), channelFile), this.baseUrl);
				const requestOptions = this.createRequestOptions(channelFileUrl);
				try {
					return await this.executor.request(requestOptions, cancellationToken);
				} catch (e) {
					if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
					throw e;
				}
			};
			try {
				let channel = this.channel;
				if (this.updater.allowPrerelease && ((_d = semver.prerelease(tag)) === null || _d === void 0 ? void 0 : _d[0])) channel = this.getCustomChannelName(String((_e = semver.prerelease(tag)) === null || _e === void 0 ? void 0 : _e[0]));
				rawData = await fetchData(channel);
			} catch (e) {
				if (this.updater.allowPrerelease) rawData = await fetchData(this.getDefaultChannelName());
				else throw e;
			}
			const result = (0, Provider_1.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
			if (result.releaseName == null) result.releaseName = latestRelease.elementValueOrEmpty("title");
			if (result.releaseNotes == null) result.releaseNotes = computeReleaseNotes(this.updater.currentVersion, this.updater.fullChangelog, feed, latestRelease);
			return {
				tag,
				...result
			};
		}
		async getLatestTagName(cancellationToken) {
			const options = this.options;
			const url = options.host == null || options.host === "github.com" ? (0, util_1.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new url_1$4.URL(`${this.computeGithubBasePath(`/repos/${options.owner}/${options.repo}/releases`)}/latest`, this.baseApiUrl);
			try {
				const rawData = await this.httpRequest(url, { Accept: "application/json" }, cancellationToken);
				if (rawData == null) return null;
				return JSON.parse(rawData).tag_name;
			} catch (e) {
				throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
			}
		}
		get basePath() {
			return `/${this.options.owner}/${this.options.repo}/releases`;
		}
		resolveFiles(updateInfo) {
			return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl, (p) => this.getBaseDownloadPath(updateInfo.tag, p.replace(/ /g, "-")));
		}
		getBaseDownloadPath(tag, fileName) {
			return `${this.basePath}/download/${tag}/${fileName}`;
		}
	};
	exports.GitHubProvider = GitHubProvider;
	function getNoteValue(parent) {
		const result = parent.elementValueOrEmpty("content");
		return result === "No content." ? "" : result;
	}
	function computeReleaseNotes(currentVersion, isFullChangelog, feed, latestRelease) {
		if (!isFullChangelog) return getNoteValue(latestRelease);
		const releaseVersionRegExp = /\/tag\/v?([^/]+)$/;
		let latestVersion = void 0;
		try {
			latestVersion = releaseVersionRegExp.exec(latestRelease.element("link").attribute("href"))[1];
			latestVersion = semver.valid(latestVersion) ? latestVersion : void 0;
		} catch {}
		if (latestVersion == null) return null;
		const releaseNotes = [];
		for (const release of feed.getElements("entry")) {
			let versionRelease;
			try {
				const match = releaseVersionRegExp.exec(release.element("link").attribute("href"));
				if (!match) continue;
				versionRelease = match[1];
			} catch {
				continue;
			}
			if (!semver.valid(versionRelease)) continue;
			const isGreaterThanCurrent = semver.gt(versionRelease, currentVersion.raw);
			const isLessOrEqualThanLatest = semver.lte(versionRelease, latestVersion);
			if (isGreaterThanCurrent && isLessOrEqualThanLatest) releaseNotes.push({
				version: versionRelease,
				note: getNoteValue(release)
			});
		}
		return releaseNotes.sort((a, b) => semver.rcompare(a.version, b.version));
	}
}));
//#endregion
//#region node_modules/electron-updater/out/providers/GitLabProvider.js
var require_GitLabProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GitLabProvider = void 0;
	var builder_util_runtime_1 = require_out();
	var url_1$3 = __require("url");
	var escapeRegExp = require_lodash_escaperegexp();
	var util_1 = require_util();
	var Provider_1 = require_Provider();
	var GitLabProvider = class extends Provider_1.Provider {
		/**
		* Normalizes filenames by replacing spaces and underscores with dashes.
		*
		* This is a workaround to handle filename formatting differences between tools:
		* - electron-builder formats filenames like "test file.txt" as "test-file.txt"
		* - GitLab may provide asset URLs using underscores, such as "test_file.txt"
		*
		* Because of this mismatch, we can't reliably extract the correct filename from
		* the asset path without normalization. This function ensures consistent matching
		* across different filename formats by converting all spaces and underscores to dashes.
		*
		* @param filename The filename to normalize
		* @returns The normalized filename with spaces and underscores replaced by dashes
		*/
		normalizeFilename(filename) {
			return filename.replace(/ |_/g, "-");
		}
		constructor(options, updater, runtimeOptions) {
			super({
				...runtimeOptions,
				isUseMultipleRangeRequest: false
			});
			this.options = options;
			this.updater = updater;
			this.cachedLatestVersion = null;
			const host = options.host || "gitlab.com";
			this.baseApiUrl = (0, util_1.newBaseUrl)(`https://${host}/api/v4`);
		}
		createRequestOptions(url, headers) {
			const result = super.createRequestOptions(url, headers);
			result.redirect = "manual";
			return result;
		}
		get channel() {
			const result = this.updater.channel || this.options.channel;
			return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
		}
		async getLatestVersion() {
			const cancellationToken = new builder_util_runtime_1.CancellationToken();
			const latestReleaseUrl = (0, util_1.newUrlFromBase)(`projects/${this.options.projectId}/releases/permalink/latest`, this.baseApiUrl);
			const header = {
				Accept: "application/json",
				...this.setAuthHeaderForToken(this.options.token || null)
			};
			let releaseResponse;
			try {
				releaseResponse = await this.httpRequest(latestReleaseUrl, header, cancellationToken);
			} catch (e) {
				throw (0, builder_util_runtime_1.newError)(`Unable to find latest release on GitLab (${latestReleaseUrl}): ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
			}
			if (!releaseResponse) throw (0, builder_util_runtime_1.newError)("No published releases on GitLab", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
			let latestRelease;
			try {
				latestRelease = JSON.parse(releaseResponse);
			} catch (e) {
				throw (0, builder_util_runtime_1.newError)(`Unable to parse latest release response from GitLab (${latestReleaseUrl}): response was not valid JSON: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
			}
			if (latestRelease.upcoming_release) throw (0, builder_util_runtime_1.newError)("Latest GitLab release is scheduled but not yet published", "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
			const tag = latestRelease.tag_name;
			let rawData = null;
			let channelFile = "";
			let channelFileUrl = null;
			const fetchChannelData = async (channelName) => {
				channelFile = (0, util_1.getChannelFilename)(channelName);
				const channelAsset = latestRelease.assets.links.find((asset) => asset.name === channelFile);
				if (!channelAsset) throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release assets`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
				channelFileUrl = new url_1$3.URL(channelAsset.direct_asset_url);
				const authHeaders = this.setAuthHeaderForToken(this.options.token || null);
				const headers = Object.keys(authHeaders).length ? authHeaders : void 0;
				try {
					const result = await this.httpRequest(channelFileUrl, headers, cancellationToken);
					if (!result) throw (0, builder_util_runtime_1.newError)(`Empty response from ${channelFileUrl}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
					return result;
				} catch (e) {
					if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
					throw e;
				}
			};
			try {
				rawData = await fetchChannelData(this.channel);
			} catch (e) {
				if (this.channel !== this.getDefaultChannelName()) rawData = await fetchChannelData(this.getDefaultChannelName());
				else throw e;
			}
			if (!rawData) throw (0, builder_util_runtime_1.newError)(`Unable to parse channel data from ${channelFile}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
			const result = (0, Provider_1.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
			if (result.releaseName == null) result.releaseName = latestRelease.name;
			if (result.releaseNotes == null) result.releaseNotes = latestRelease.description || null;
			const gitlabUpdateInfo = {
				tag,
				assets: this.convertAssetsToMap(latestRelease.assets),
				...result
			};
			this.cachedLatestVersion = gitlabUpdateInfo;
			return gitlabUpdateInfo;
		}
		/**
		* Utility function to convert GitlabReleaseAsset to Map<string, string>
		* Maps asset names to their download URLs
		*/
		convertAssetsToMap(assets) {
			const assetsMap = /* @__PURE__ */ new Map();
			for (const asset of assets.links) assetsMap.set(this.normalizeFilename(asset.name), asset.direct_asset_url);
			return assetsMap;
		}
		/**
		* Find blockmap file URL in assets map for a specific filename
		*/
		findBlockMapInAssets(assets, filename) {
			const possibleBlockMapNames = [`${filename}.blockmap`, `${this.normalizeFilename(filename)}.blockmap`];
			for (const blockMapName of possibleBlockMapNames) {
				const assetUrl = assets.get(blockMapName);
				if (assetUrl) return new url_1$3.URL(assetUrl);
			}
			return null;
		}
		async fetchReleaseInfoByVersion(version) {
			const cancellationToken = new builder_util_runtime_1.CancellationToken();
			const possibleReleaseIds = [`v${version}`, version];
			for (const releaseId of possibleReleaseIds) {
				const releaseUrl = (0, util_1.newUrlFromBase)(`projects/${this.options.projectId}/releases/${encodeURIComponent(releaseId)}`, this.baseApiUrl);
				try {
					const header = {
						Accept: "application/json",
						...this.setAuthHeaderForToken(this.options.token || null)
					};
					const releaseResponse = await this.httpRequest(releaseUrl, header, cancellationToken);
					if (releaseResponse) return JSON.parse(releaseResponse);
				} catch (e) {
					if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) continue;
					throw (0, builder_util_runtime_1.newError)(`Unable to find release ${releaseId} on GitLab (${releaseUrl}): ${e.stack || e.message}`, "ERR_UPDATER_RELEASE_NOT_FOUND");
				}
			}
			throw (0, builder_util_runtime_1.newError)(`Unable to find release with version ${version} (tried: ${possibleReleaseIds.join(", ")}) on GitLab`, "ERR_UPDATER_RELEASE_NOT_FOUND");
		}
		setAuthHeaderForToken(token) {
			const headers = {};
			if (token != null) {
				if (token.startsWith("Bearer")) headers.authorization = token;
				else headers["PRIVATE-TOKEN"] = token;
			}
			return headers;
		}
		/**
		* Get version info for blockmap files, using cache when possible
		*/
		async getVersionInfoForBlockMap(version) {
			if (this.cachedLatestVersion && this.cachedLatestVersion.version === version) return this.cachedLatestVersion.assets;
			const versionInfo = await this.fetchReleaseInfoByVersion(version);
			if (versionInfo && versionInfo.assets) return this.convertAssetsToMap(versionInfo.assets);
			return null;
		}
		/**
		* Find blockmap URLs from version assets
		*/
		async findBlockMapUrlsFromAssets(oldVersion, newVersion, baseFilename) {
			let newBlockMapUrl = null;
			let oldBlockMapUrl = null;
			const newVersionAssets = await this.getVersionInfoForBlockMap(newVersion);
			if (newVersionAssets) newBlockMapUrl = this.findBlockMapInAssets(newVersionAssets, baseFilename);
			const oldVersionAssets = await this.getVersionInfoForBlockMap(oldVersion);
			if (oldVersionAssets) {
				const oldFilename = baseFilename.replace(new RegExp(escapeRegExp(newVersion), "g"), oldVersion);
				oldBlockMapUrl = this.findBlockMapInAssets(oldVersionAssets, oldFilename);
			}
			return [oldBlockMapUrl, newBlockMapUrl];
		}
		async getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl = null) {
			if (this.options.uploadTarget === "project_upload") {
				const baseFilename = baseUrl.pathname.split("/").pop() || "";
				const [oldBlockMapUrl, newBlockMapUrl] = await this.findBlockMapUrlsFromAssets(oldVersion, newVersion, baseFilename);
				if (!newBlockMapUrl) throw (0, builder_util_runtime_1.newError)(`Cannot find blockmap file for ${newVersion} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
				if (!oldBlockMapUrl) throw (0, builder_util_runtime_1.newError)(`Cannot find blockmap file for ${oldVersion} in GitLab assets`, "ERR_UPDATER_BLOCKMAP_FILE_NOT_FOUND");
				return [oldBlockMapUrl, newBlockMapUrl];
			} else return super.getBlockMapFiles(baseUrl, oldVersion, newVersion, oldBlockMapFileBaseUrl);
		}
		resolveFiles(updateInfo) {
			return (0, Provider_1.getFileList)(updateInfo).map((fileInfo) => {
				const matchingAssetName = [fileInfo.url, this.normalizeFilename(fileInfo.url)].find((name) => updateInfo.assets.has(name));
				const assetUrl = matchingAssetName ? updateInfo.assets.get(matchingAssetName) : void 0;
				if (!assetUrl) throw (0, builder_util_runtime_1.newError)(`Cannot find asset "${fileInfo.url}" in GitLab release assets. Available assets: ${Array.from(updateInfo.assets.keys()).join(", ")}`, "ERR_UPDATER_ASSET_NOT_FOUND");
				return {
					url: new url_1$3.URL(assetUrl),
					info: fileInfo
				};
			});
		}
		toString() {
			return `GitLab (projectId: ${this.options.projectId}, channel: ${this.channel})`;
		}
	};
	exports.GitLabProvider = GitLabProvider;
}));
//#endregion
//#region node_modules/electron-updater/out/providers/KeygenProvider.js
var require_KeygenProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.KeygenProvider = void 0;
	var builder_util_runtime_1 = require_out();
	var util_1 = require_util();
	var Provider_1 = require_Provider();
	var KeygenProvider = class extends Provider_1.Provider {
		constructor(configuration, updater, runtimeOptions) {
			super({
				...runtimeOptions,
				isUseMultipleRangeRequest: false
			});
			this.configuration = configuration;
			this.updater = updater;
			this.defaultHostname = "api.keygen.sh";
			const host = this.configuration.host || this.defaultHostname;
			this.baseUrl = (0, util_1.newBaseUrl)(`https://${host}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
		}
		get channel() {
			return this.updater.channel || this.configuration.channel || "stable";
		}
		async getLatestVersion() {
			const cancellationToken = new builder_util_runtime_1.CancellationToken();
			const channelFile = (0, util_1.getChannelFilename)(this.getCustomChannelName(this.channel));
			const channelUrl = (0, util_1.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
			try {
				const updateInfo = await this.httpRequest(channelUrl, {
					Accept: "application/vnd.api+json",
					"Keygen-Version": "1.1"
				}, cancellationToken);
				return (0, Provider_1.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
			} catch (e) {
				throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
			}
		}
		resolveFiles(updateInfo) {
			return (0, Provider_1.resolveFiles)(updateInfo, this.baseUrl);
		}
		toString() {
			const { account, product, platform } = this.configuration;
			return `Keygen (account: ${account}, product: ${product}, platform: ${platform}, channel: ${this.channel})`;
		}
	};
	exports.KeygenProvider = KeygenProvider;
}));
//#endregion
//#region node_modules/electron-updater/out/providers/PrivateGitHubProvider.js
var require_PrivateGitHubProvider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PrivateGitHubProvider = void 0;
	var builder_util_runtime_1 = require_out();
	var js_yaml_1 = require_js_yaml();
	var path$8 = __require("path");
	var url_1$2 = __require("url");
	var util_1 = require_util();
	var GitHubProvider_1 = require_GitHubProvider();
	var Provider_1 = require_Provider();
	var PrivateGitHubProvider = class extends GitHubProvider_1.BaseGitHubProvider {
		constructor(options, updater, token, runtimeOptions) {
			super(options, "api.github.com", runtimeOptions);
			this.updater = updater;
			this.token = token;
		}
		createRequestOptions(url, headers) {
			const result = super.createRequestOptions(url, headers);
			result.redirect = "manual";
			return result;
		}
		async getLatestVersion() {
			const cancellationToken = new builder_util_runtime_1.CancellationToken();
			const channelFile = (0, util_1.getChannelFilename)(this.getDefaultChannelName());
			const releaseInfo = await this.getLatestVersionInfo(cancellationToken);
			const asset = releaseInfo.assets.find((it) => it.name === channelFile);
			if (asset == null) throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the release ${releaseInfo.html_url || releaseInfo.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
			const url = new url_1$2.URL(asset.url);
			let result;
			try {
				result = (0, js_yaml_1.load)(await this.httpRequest(url, this.configureHeaders("application/octet-stream"), cancellationToken));
			} catch (e) {
				if (e instanceof builder_util_runtime_1.HttpError && e.statusCode === 404) throw (0, builder_util_runtime_1.newError)(`Cannot find ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
				throw e;
			}
			result.assets = releaseInfo.assets;
			return result;
		}
		get fileExtraDownloadHeaders() {
			return this.configureHeaders("application/octet-stream");
		}
		configureHeaders(accept) {
			return {
				accept,
				authorization: `token ${this.token}`
			};
		}
		async getLatestVersionInfo(cancellationToken) {
			const allowPrerelease = this.updater.allowPrerelease;
			let basePath = this.basePath;
			if (!allowPrerelease) basePath = `${basePath}/latest`;
			const url = (0, util_1.newUrlFromBase)(basePath, this.baseUrl);
			try {
				const version = JSON.parse(await this.httpRequest(url, this.configureHeaders("application/vnd.github.v3+json"), cancellationToken));
				if (allowPrerelease) {
					const candidates = version.filter((it) => !it.draft);
					return candidates.find((it) => it.prerelease) || candidates[0];
				} else return version;
			} catch (e) {
				throw (0, builder_util_runtime_1.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
			}
		}
		get basePath() {
			return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
		}
		resolveFiles(updateInfo) {
			return (0, Provider_1.getFileList)(updateInfo).map((it) => {
				const name = path$8.posix.basename(it.url).replace(/ /g, "-");
				const asset = updateInfo.assets.find((it) => it != null && it.name === name);
				if (asset == null) throw (0, builder_util_runtime_1.newError)(`Cannot find asset "${name}" in: ${JSON.stringify(updateInfo.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
				return {
					url: new url_1$2.URL(asset.url),
					info: it
				};
			});
		}
	};
	exports.PrivateGitHubProvider = PrivateGitHubProvider;
}));
//#endregion
//#region node_modules/electron-updater/out/providerFactory.js
var require_providerFactory = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isUrlProbablySupportMultiRangeRequests = isUrlProbablySupportMultiRangeRequests;
	exports.createClient = createClient;
	var builder_util_runtime_1 = require_out();
	var BitbucketProvider_1 = require_BitbucketProvider();
	var GenericProvider_1 = require_GenericProvider();
	var GitHubProvider_1 = require_GitHubProvider();
	var GitLabProvider_1 = require_GitLabProvider();
	var KeygenProvider_1 = require_KeygenProvider();
	var PrivateGitHubProvider_1 = require_PrivateGitHubProvider();
	function isUrlProbablySupportMultiRangeRequests(url) {
		return !url.includes("s3.amazonaws.com");
	}
	function createClient(data, updater, runtimeOptions) {
		if (typeof data === "string") throw (0, builder_util_runtime_1.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
		const provider = data.provider;
		switch (provider) {
			case "github": {
				const githubOptions = data;
				const token = (githubOptions.private ? process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"] : null) || githubOptions.token;
				if (token == null) return new GitHubProvider_1.GitHubProvider(githubOptions, updater, runtimeOptions);
				else return new PrivateGitHubProvider_1.PrivateGitHubProvider(githubOptions, updater, token, runtimeOptions);
			}
			case "bitbucket": return new BitbucketProvider_1.BitbucketProvider(data, updater, runtimeOptions);
			case "gitlab": return new GitLabProvider_1.GitLabProvider(data, updater, runtimeOptions);
			case "keygen": return new KeygenProvider_1.KeygenProvider(data, updater, runtimeOptions);
			case "s3":
			case "spaces": return new GenericProvider_1.GenericProvider({
				provider: "generic",
				url: (0, builder_util_runtime_1.getS3LikeProviderBaseUrl)(data),
				channel: data.channel || null
			}, updater, {
				...runtimeOptions,
				isUseMultipleRangeRequest: false
			});
			case "generic": {
				const options = data;
				return new GenericProvider_1.GenericProvider(options, updater, {
					...runtimeOptions,
					isUseMultipleRangeRequest: options.useMultipleRangeRequest !== false && isUrlProbablySupportMultiRangeRequests(options.url)
				});
			}
			case "custom": {
				const options = data;
				const constructor = options.updateProvider;
				if (!constructor) throw (0, builder_util_runtime_1.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
				return new constructor(options, updater, runtimeOptions);
			}
			default: throw (0, builder_util_runtime_1.newError)(`Unsupported provider: ${provider}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
		}
	}
}));
//#endregion
//#region node_modules/electron-updater/out/differentialDownloader/downloadPlanBuilder.js
var require_downloadPlanBuilder = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.OperationKind = void 0;
	exports.computeOperations = computeOperations;
	var OperationKind;
	(function(OperationKind) {
		OperationKind[OperationKind["COPY"] = 0] = "COPY";
		OperationKind[OperationKind["DOWNLOAD"] = 1] = "DOWNLOAD";
	})(OperationKind || (exports.OperationKind = OperationKind = {}));
	function computeOperations(oldBlockMap, newBlockMap, logger) {
		const nameToOldBlocks = buildBlockFileMap(oldBlockMap.files);
		const nameToNewBlocks = buildBlockFileMap(newBlockMap.files);
		let lastOperation = null;
		const blockMapFile = newBlockMap.files[0];
		const operations = [];
		const name = blockMapFile.name;
		const oldEntry = nameToOldBlocks.get(name);
		if (oldEntry == null) throw new Error(`no file ${name} in old blockmap`);
		const newFile = nameToNewBlocks.get(name);
		let changedBlockCount = 0;
		const { checksumToOffset: checksumToOldOffset, checksumToOldSize } = buildChecksumMap(nameToOldBlocks.get(name), oldEntry.offset, logger);
		let newOffset = blockMapFile.offset;
		for (let i = 0; i < newFile.checksums.length; newOffset += newFile.sizes[i], i++) {
			const blockSize = newFile.sizes[i];
			const checksum = newFile.checksums[i];
			let oldOffset = checksumToOldOffset.get(checksum);
			if (oldOffset != null && checksumToOldSize.get(checksum) !== blockSize) {
				logger.warn(`Checksum ("${checksum}") matches, but size differs (old: ${checksumToOldSize.get(checksum)}, new: ${blockSize})`);
				oldOffset = void 0;
			}
			if (oldOffset === void 0) {
				changedBlockCount++;
				if (lastOperation != null && lastOperation.kind === OperationKind.DOWNLOAD && lastOperation.end === newOffset) lastOperation.end += blockSize;
				else {
					lastOperation = {
						kind: OperationKind.DOWNLOAD,
						start: newOffset,
						end: newOffset + blockSize
					};
					validateAndAdd(lastOperation, operations, checksum, i);
				}
			} else if (lastOperation != null && lastOperation.kind === OperationKind.COPY && lastOperation.end === oldOffset) lastOperation.end += blockSize;
			else {
				lastOperation = {
					kind: OperationKind.COPY,
					start: oldOffset,
					end: oldOffset + blockSize
				};
				validateAndAdd(lastOperation, operations, checksum, i);
			}
		}
		if (changedBlockCount > 0) logger.info(`File${blockMapFile.name === "file" ? "" : " " + blockMapFile.name} has ${changedBlockCount} changed blocks`);
		return operations;
	}
	var isValidateOperationRange = process.env["DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES"] === "true";
	function validateAndAdd(operation, operations, checksum, index) {
		if (isValidateOperationRange && operations.length !== 0) {
			const lastOperation = operations[operations.length - 1];
			if (lastOperation.kind === operation.kind && operation.start < lastOperation.end && operation.start > lastOperation.start) {
				const min = [
					lastOperation.start,
					lastOperation.end,
					operation.start,
					operation.end
				].reduce((p, v) => p < v ? p : v);
				throw new Error(`operation (block index: ${index}, checksum: ${checksum}, kind: ${OperationKind[operation.kind]}) overlaps previous operation (checksum: ${checksum}):\nabs: ${lastOperation.start} until ${lastOperation.end} and ${operation.start} until ${operation.end}\nrel: ${lastOperation.start - min} until ${lastOperation.end - min} and ${operation.start - min} until ${operation.end - min}`);
			}
		}
		operations.push(operation);
	}
	function buildChecksumMap(file, fileOffset, logger) {
		const checksumToOffset = /* @__PURE__ */ new Map();
		const checksumToSize = /* @__PURE__ */ new Map();
		let offset = fileOffset;
		for (let i = 0; i < file.checksums.length; i++) {
			const checksum = file.checksums[i];
			const size = file.sizes[i];
			const existing = checksumToSize.get(checksum);
			if (existing === void 0) {
				checksumToOffset.set(checksum, offset);
				checksumToSize.set(checksum, size);
			} else if (logger.debug != null) {
				const sizeExplanation = existing === size ? "(same size)" : `(size: ${existing}, this size: ${size})`;
				logger.debug(`${checksum} duplicated in blockmap ${sizeExplanation}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
			}
			offset += size;
		}
		return {
			checksumToOffset,
			checksumToOldSize: checksumToSize
		};
	}
	function buildBlockFileMap(list) {
		const result = /* @__PURE__ */ new Map();
		for (const item of list) result.set(item.name, item);
		return result;
	}
}));
//#endregion
//#region node_modules/electron-updater/out/differentialDownloader/DataSplitter.js
var require_DataSplitter = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DataSplitter = void 0;
	exports.copyData = copyData;
	var builder_util_runtime_1 = require_out();
	var fs_1$3 = __require("fs");
	var stream_1$1 = __require("stream");
	var downloadPlanBuilder_1 = require_downloadPlanBuilder();
	var DOUBLE_CRLF = Buffer.from("\r\n\r\n");
	var ReadState;
	(function(ReadState) {
		ReadState[ReadState["INIT"] = 0] = "INIT";
		ReadState[ReadState["HEADER"] = 1] = "HEADER";
		ReadState[ReadState["BODY"] = 2] = "BODY";
	})(ReadState || (ReadState = {}));
	function copyData(task, out, oldFileFd, reject, resolve) {
		const readStream = (0, fs_1$3.createReadStream)("", {
			fd: oldFileFd,
			autoClose: false,
			start: task.start,
			end: task.end - 1
		});
		readStream.on("error", reject);
		readStream.once("end", resolve);
		readStream.pipe(out, { end: false });
	}
	var DataSplitter = class extends stream_1$1.Writable {
		constructor(out, options, partIndexToTaskIndex, boundary, partIndexToLength, finishHandler, grandTotalBytes, onProgress) {
			super();
			this.out = out;
			this.options = options;
			this.partIndexToTaskIndex = partIndexToTaskIndex;
			this.partIndexToLength = partIndexToLength;
			this.finishHandler = finishHandler;
			this.grandTotalBytes = grandTotalBytes;
			this.onProgress = onProgress;
			this.start = Date.now();
			this.nextUpdate = this.start + 1e3;
			this.transferred = 0;
			this.delta = 0;
			this.partIndex = -1;
			this.headerListBuffer = null;
			this.readState = ReadState.INIT;
			this.ignoreByteCount = 0;
			this.remainingPartDataCount = 0;
			this.actualPartLength = 0;
			this.boundaryLength = boundary.length + 4;
			this.ignoreByteCount = this.boundaryLength - 2;
		}
		get isFinished() {
			return this.partIndex === this.partIndexToLength.length;
		}
		_write(data, encoding, callback) {
			if (this.isFinished) {
				console.error(`Trailing ignored data: ${data.length} bytes`);
				return;
			}
			this.handleData(data).then(() => {
				if (this.onProgress) {
					const now = Date.now();
					if ((now >= this.nextUpdate || this.transferred === this.grandTotalBytes) && this.grandTotalBytes && (now - this.start) / 1e3) {
						this.nextUpdate = now + 1e3;
						this.onProgress({
							total: this.grandTotalBytes,
							delta: this.delta,
							transferred: this.transferred,
							percent: this.transferred / this.grandTotalBytes * 100,
							bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
						});
						this.delta = 0;
					}
				}
				callback();
			}).catch(callback);
		}
		async handleData(chunk) {
			let start = 0;
			if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0) throw (0, builder_util_runtime_1.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
			if (this.ignoreByteCount > 0) {
				const toIgnore = Math.min(this.ignoreByteCount, chunk.length);
				this.ignoreByteCount -= toIgnore;
				start = toIgnore;
			} else if (this.remainingPartDataCount > 0) {
				const toRead = Math.min(this.remainingPartDataCount, chunk.length);
				this.remainingPartDataCount -= toRead;
				await this.processPartData(chunk, 0, toRead);
				start = toRead;
			}
			if (start === chunk.length) return;
			if (this.readState === ReadState.HEADER) {
				const headerListEnd = this.searchHeaderListEnd(chunk, start);
				if (headerListEnd === -1) return;
				start = headerListEnd;
				this.readState = ReadState.BODY;
				this.headerListBuffer = null;
			}
			while (true) {
				if (this.readState === ReadState.BODY) this.readState = ReadState.INIT;
				else {
					this.partIndex++;
					let taskIndex = this.partIndexToTaskIndex.get(this.partIndex);
					if (taskIndex == null) {
						if (this.isFinished) taskIndex = this.options.end;
						else throw (0, builder_util_runtime_1.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
					}
					const prevTaskIndex = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
					if (prevTaskIndex < taskIndex) await this.copyExistingData(prevTaskIndex, taskIndex);
					else if (prevTaskIndex > taskIndex) throw (0, builder_util_runtime_1.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
					if (this.isFinished) {
						this.onPartEnd();
						this.finishHandler();
						return;
					}
					start = this.searchHeaderListEnd(chunk, start);
					if (start === -1) {
						this.readState = ReadState.HEADER;
						return;
					}
				}
				const partLength = this.partIndexToLength[this.partIndex];
				const end = start + partLength;
				const effectiveEnd = Math.min(end, chunk.length);
				await this.processPartStarted(chunk, start, effectiveEnd);
				this.remainingPartDataCount = partLength - (effectiveEnd - start);
				if (this.remainingPartDataCount > 0) return;
				start = end + this.boundaryLength;
				if (start >= chunk.length) {
					this.ignoreByteCount = this.boundaryLength - (chunk.length - end);
					return;
				}
			}
		}
		copyExistingData(index, end) {
			return new Promise((resolve, reject) => {
				const w = () => {
					if (index === end) {
						resolve();
						return;
					}
					const task = this.options.tasks[index];
					if (task.kind !== downloadPlanBuilder_1.OperationKind.COPY) {
						reject(/* @__PURE__ */ new Error("Task kind must be COPY"));
						return;
					}
					copyData(task, this.out, this.options.oldFileFd, reject, () => {
						index++;
						w();
					});
				};
				w();
			});
		}
		searchHeaderListEnd(chunk, readOffset) {
			const headerListEnd = chunk.indexOf(DOUBLE_CRLF, readOffset);
			if (headerListEnd !== -1) return headerListEnd + DOUBLE_CRLF.length;
			const partialChunk = readOffset === 0 ? chunk : chunk.slice(readOffset);
			if (this.headerListBuffer == null) this.headerListBuffer = partialChunk;
			else this.headerListBuffer = Buffer.concat([this.headerListBuffer, partialChunk]);
			return -1;
		}
		onPartEnd() {
			const expectedLength = this.partIndexToLength[this.partIndex - 1];
			if (this.actualPartLength !== expectedLength) throw (0, builder_util_runtime_1.newError)(`Expected length: ${expectedLength} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
			this.actualPartLength = 0;
		}
		processPartStarted(data, start, end) {
			if (this.partIndex !== 0) this.onPartEnd();
			return this.processPartData(data, start, end);
		}
		processPartData(data, start, end) {
			this.actualPartLength += end - start;
			this.transferred += end - start;
			this.delta += end - start;
			const out = this.out;
			if (out.write(start === 0 && data.length === end ? data : data.slice(start, end))) return Promise.resolve();
			else return new Promise((resolve, reject) => {
				out.on("error", reject);
				out.once("drain", () => {
					out.removeListener("error", reject);
					resolve();
				});
			});
		}
	};
	exports.DataSplitter = DataSplitter;
}));
//#endregion
//#region node_modules/electron-updater/out/differentialDownloader/multipleRangeDownloader.js
var require_multipleRangeDownloader = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.executeTasksUsingMultipleRangeRequests = executeTasksUsingMultipleRangeRequests;
	exports.checkIsRangesSupported = checkIsRangesSupported;
	var builder_util_runtime_1 = require_out();
	var DataSplitter_1 = require_DataSplitter();
	var downloadPlanBuilder_1 = require_downloadPlanBuilder();
	function executeTasksUsingMultipleRangeRequests(differentialDownloader, tasks, out, oldFileFd, reject) {
		const w = (taskOffset) => {
			if (taskOffset >= tasks.length) {
				if (differentialDownloader.fileMetadataBuffer != null) out.write(differentialDownloader.fileMetadataBuffer);
				out.end();
				return;
			}
			const nextOffset = taskOffset + 1e3;
			doExecuteTasks(differentialDownloader, {
				tasks,
				start: taskOffset,
				end: Math.min(tasks.length, nextOffset),
				oldFileFd
			}, out, () => w(nextOffset), reject);
		};
		return w;
	}
	function doExecuteTasks(differentialDownloader, options, out, resolve, reject) {
		let ranges = "bytes=";
		let partCount = 0;
		let grandTotalBytes = 0;
		const partIndexToTaskIndex = /* @__PURE__ */ new Map();
		const partIndexToLength = [];
		for (let i = options.start; i < options.end; i++) {
			const task = options.tasks[i];
			if (task.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
				ranges += `${task.start}-${task.end - 1}, `;
				partIndexToTaskIndex.set(partCount, i);
				partCount++;
				partIndexToLength.push(task.end - task.start);
				grandTotalBytes += task.end - task.start;
			}
		}
		if (partCount <= 1) {
			const w = (index) => {
				if (index >= options.end) {
					resolve();
					return;
				}
				const task = options.tasks[index++];
				if (task.kind === downloadPlanBuilder_1.OperationKind.COPY) (0, DataSplitter_1.copyData)(task, out, options.oldFileFd, reject, () => w(index));
				else {
					const requestOptions = differentialDownloader.createRequestOptions();
					requestOptions.headers.Range = `bytes=${task.start}-${task.end - 1}`;
					const request = differentialDownloader.httpExecutor.createRequest(requestOptions, (response) => {
						response.on("error", reject);
						if (!checkIsRangesSupported(response, reject)) return;
						response.pipe(out, { end: false });
						response.once("end", () => w(index));
					});
					differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
					request.end();
				}
			};
			w(options.start);
			return;
		}
		const requestOptions = differentialDownloader.createRequestOptions();
		requestOptions.headers.Range = ranges.substring(0, ranges.length - 2);
		const request = differentialDownloader.httpExecutor.createRequest(requestOptions, (response) => {
			if (!checkIsRangesSupported(response, reject)) return;
			const contentType = (0, builder_util_runtime_1.safeGetHeader)(response, "content-type");
			const m = /^multipart\/.+?\s*;\s*boundary=(?:"([^"]+)"|([^\s";]+))\s*$/i.exec(contentType);
			if (m == null) {
				reject(/* @__PURE__ */ new Error(`Content-Type "multipart/byteranges" is expected, but got "${contentType}"`));
				return;
			}
			const dicer = new DataSplitter_1.DataSplitter(out, options, partIndexToTaskIndex, m[1] || m[2], partIndexToLength, resolve, grandTotalBytes, differentialDownloader.options.onProgress);
			dicer.on("error", reject);
			response.pipe(dicer);
			response.on("end", () => {
				setTimeout(() => {
					request.abort();
					reject(/* @__PURE__ */ new Error("Response ends without calling any handlers"));
				}, 1e4);
			});
		});
		differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
		request.end();
	}
	function checkIsRangesSupported(response, reject) {
		if (response.statusCode >= 400) {
			reject((0, builder_util_runtime_1.createHttpError)(response));
			return false;
		}
		if (response.statusCode !== 206) {
			const acceptRanges = (0, builder_util_runtime_1.safeGetHeader)(response, "accept-ranges");
			if (acceptRanges == null || acceptRanges === "none") {
				reject(/* @__PURE__ */ new Error(`Server doesn't support Accept-Ranges (response code ${response.statusCode})`));
				return false;
			}
		}
		return true;
	}
}));
//#endregion
//#region node_modules/electron-updater/out/differentialDownloader/ProgressDifferentialDownloadCallbackTransform.js
var require_ProgressDifferentialDownloadCallbackTransform = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ProgressDifferentialDownloadCallbackTransform = void 0;
	var stream_1 = __require("stream");
	var OperationKind;
	(function(OperationKind) {
		OperationKind[OperationKind["COPY"] = 0] = "COPY";
		OperationKind[OperationKind["DOWNLOAD"] = 1] = "DOWNLOAD";
	})(OperationKind || (OperationKind = {}));
	var ProgressDifferentialDownloadCallbackTransform = class extends stream_1.Transform {
		constructor(progressDifferentialDownloadInfo, cancellationToken, onProgress) {
			super();
			this.progressDifferentialDownloadInfo = progressDifferentialDownloadInfo;
			this.cancellationToken = cancellationToken;
			this.onProgress = onProgress;
			this.start = Date.now();
			this.transferred = 0;
			this.delta = 0;
			this.expectedBytes = 0;
			this.index = 0;
			this.operationType = OperationKind.COPY;
			this.nextUpdate = this.start + 1e3;
		}
		_transform(chunk, encoding, callback) {
			if (this.cancellationToken.cancelled) {
				callback(/* @__PURE__ */ new Error("cancelled"), null);
				return;
			}
			if (this.operationType == OperationKind.COPY) {
				callback(null, chunk);
				return;
			}
			this.transferred += chunk.length;
			this.delta += chunk.length;
			const now = Date.now();
			if (now >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
				this.nextUpdate = now + 1e3;
				this.onProgress({
					total: this.progressDifferentialDownloadInfo.grandTotal,
					delta: this.delta,
					transferred: this.transferred,
					percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
					bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
				});
				this.delta = 0;
			}
			callback(null, chunk);
		}
		beginFileCopy() {
			this.operationType = OperationKind.COPY;
		}
		beginRangeDownload() {
			this.operationType = OperationKind.DOWNLOAD;
			this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
		}
		endRangeDownload() {
			if (this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) this.onProgress({
				total: this.progressDifferentialDownloadInfo.grandTotal,
				delta: this.delta,
				transferred: this.transferred,
				percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
				bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
			});
		}
		_flush(callback) {
			if (this.cancellationToken.cancelled) {
				callback(/* @__PURE__ */ new Error("cancelled"));
				return;
			}
			this.onProgress({
				total: this.progressDifferentialDownloadInfo.grandTotal,
				delta: this.delta,
				transferred: this.transferred,
				percent: 100,
				bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
			});
			this.delta = 0;
			this.transferred = 0;
			callback(null);
		}
	};
	exports.ProgressDifferentialDownloadCallbackTransform = ProgressDifferentialDownloadCallbackTransform;
}));
//#endregion
//#region node_modules/electron-updater/out/differentialDownloader/DifferentialDownloader.js
var require_DifferentialDownloader = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DifferentialDownloader = void 0;
	var builder_util_runtime_1 = require_out();
	var fs_extra_1 = require_lib();
	var fs_1$2 = __require("fs");
	var DataSplitter_1 = require_DataSplitter();
	var url_1$1 = __require("url");
	var downloadPlanBuilder_1 = require_downloadPlanBuilder();
	var multipleRangeDownloader_1 = require_multipleRangeDownloader();
	var ProgressDifferentialDownloadCallbackTransform_1 = require_ProgressDifferentialDownloadCallbackTransform();
	var DifferentialDownloader = class {
		constructor(blockAwareFileInfo, httpExecutor, options) {
			this.blockAwareFileInfo = blockAwareFileInfo;
			this.httpExecutor = httpExecutor;
			this.options = options;
			this.fileMetadataBuffer = null;
			this.logger = options.logger;
		}
		createRequestOptions() {
			const result = { headers: {
				...this.options.requestHeaders,
				accept: "*/*"
			} };
			(0, builder_util_runtime_1.configureRequestUrl)(this.options.newUrl, result);
			(0, builder_util_runtime_1.configureRequestOptions)(result);
			return result;
		}
		doDownload(oldBlockMap, newBlockMap) {
			if (oldBlockMap.version !== newBlockMap.version) throw new Error(`version is different (${oldBlockMap.version} - ${newBlockMap.version}), full download is required`);
			const logger = this.logger;
			const operations = (0, downloadPlanBuilder_1.computeOperations)(oldBlockMap, newBlockMap, logger);
			if (logger.debug != null) logger.debug(JSON.stringify(operations, null, 2));
			let downloadSize = 0;
			let copySize = 0;
			for (const operation of operations) {
				const length = operation.end - operation.start;
				if (operation.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) downloadSize += length;
				else copySize += length;
			}
			const newSize = this.blockAwareFileInfo.size;
			if (downloadSize + copySize + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== newSize) throw new Error(`Internal error, size mismatch: downloadSize: ${downloadSize}, copySize: ${copySize}, newSize: ${newSize}`);
			logger.info(`Full: ${formatBytes(newSize)}, To download: ${formatBytes(downloadSize)} (${Math.round(downloadSize / (newSize / 100))}%)`);
			return this.downloadFile(operations);
		}
		downloadFile(tasks) {
			const fdList = [];
			const closeFiles = () => {
				return Promise.all(fdList.map((openedFile) => {
					return (0, fs_extra_1.close)(openedFile.descriptor).catch((e) => {
						this.logger.error(`cannot close file "${openedFile.path}": ${e}`);
					});
				}));
			};
			return this.doDownloadFile(tasks, fdList).then(closeFiles).catch((e) => {
				return closeFiles().catch((closeFilesError) => {
					try {
						this.logger.error(`cannot close files: ${closeFilesError}`);
					} catch (errorOnLog) {
						try {
							console.error(errorOnLog);
						} catch (_ignored) {}
					}
					throw e;
				}).then(() => {
					throw e;
				});
			});
		}
		async doDownloadFile(tasks, fdList) {
			const oldFileFd = await (0, fs_extra_1.open)(this.options.oldFile, "r");
			fdList.push({
				descriptor: oldFileFd,
				path: this.options.oldFile
			});
			const newFileFd = await (0, fs_extra_1.open)(this.options.newFile, "w");
			fdList.push({
				descriptor: newFileFd,
				path: this.options.newFile
			});
			const fileOut = (0, fs_1$2.createWriteStream)(this.options.newFile, { fd: newFileFd });
			await new Promise((resolve, reject) => {
				const streams = [];
				let downloadInfoTransform = void 0;
				if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
					const expectedByteCounts = [];
					let grandTotalBytes = 0;
					for (const task of tasks) if (task.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
						expectedByteCounts.push(task.end - task.start);
						grandTotalBytes += task.end - task.start;
					}
					const progressDifferentialDownloadInfo = {
						expectedByteCounts,
						grandTotal: grandTotalBytes
					};
					downloadInfoTransform = new ProgressDifferentialDownloadCallbackTransform_1.ProgressDifferentialDownloadCallbackTransform(progressDifferentialDownloadInfo, this.options.cancellationToken, this.options.onProgress);
					streams.push(downloadInfoTransform);
				}
				const digestTransform = new builder_util_runtime_1.DigestTransform(this.blockAwareFileInfo.sha512);
				digestTransform.isValidateOnEnd = false;
				streams.push(digestTransform);
				fileOut.on("finish", () => {
					fileOut.close(() => {
						fdList.splice(1, 1);
						try {
							digestTransform.validate();
						} catch (e) {
							reject(e);
							return;
						}
						resolve(void 0);
					});
				});
				streams.push(fileOut);
				let lastStream = null;
				for (const stream of streams) {
					stream.on("error", reject);
					if (lastStream == null) lastStream = stream;
					else lastStream = lastStream.pipe(stream);
				}
				const firstStream = streams[0];
				let w;
				if (this.options.isUseMultipleRangeRequest) {
					w = (0, multipleRangeDownloader_1.executeTasksUsingMultipleRangeRequests)(this, tasks, firstStream, oldFileFd, reject);
					w(0);
					return;
				}
				let downloadOperationCount = 0;
				let actualUrl = null;
				this.logger.info(`Differential download: ${this.options.newUrl}`);
				const requestOptions = this.createRequestOptions();
				requestOptions.redirect = "manual";
				w = (index) => {
					var _a, _b;
					if (index >= tasks.length) {
						if (this.fileMetadataBuffer != null) firstStream.write(this.fileMetadataBuffer);
						firstStream.end();
						return;
					}
					const operation = tasks[index++];
					if (operation.kind === downloadPlanBuilder_1.OperationKind.COPY) {
						if (downloadInfoTransform) downloadInfoTransform.beginFileCopy();
						(0, DataSplitter_1.copyData)(operation, firstStream, oldFileFd, reject, () => w(index));
						return;
					}
					const range = `bytes=${operation.start}-${operation.end - 1}`;
					requestOptions.headers.range = range;
					(_b = (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 || _b.call(_a, `download range: ${range}`);
					if (downloadInfoTransform) downloadInfoTransform.beginRangeDownload();
					const request = this.httpExecutor.createRequest(requestOptions, (response) => {
						response.on("error", reject);
						response.on("aborted", () => {
							reject(/* @__PURE__ */ new Error("response has been aborted by the server"));
						});
						if (response.statusCode >= 400) reject((0, builder_util_runtime_1.createHttpError)(response));
						response.pipe(firstStream, { end: false });
						response.once("end", () => {
							if (downloadInfoTransform) downloadInfoTransform.endRangeDownload();
							if (++downloadOperationCount === 100) {
								downloadOperationCount = 0;
								setTimeout(() => w(index), 1e3);
							} else w(index);
						});
					});
					request.on("redirect", (statusCode, method, redirectUrl) => {
						this.logger.info(`Redirect to ${removeQuery(redirectUrl)}`);
						actualUrl = redirectUrl;
						(0, builder_util_runtime_1.configureRequestUrl)(new url_1$1.URL(actualUrl), requestOptions);
						request.followRedirect();
					});
					this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
					request.end();
				};
				w(0);
			});
		}
		async readRemoteBytes(start, endInclusive) {
			const buffer = Buffer.allocUnsafe(endInclusive + 1 - start);
			const requestOptions = this.createRequestOptions();
			requestOptions.headers.range = `bytes=${start}-${endInclusive}`;
			let position = 0;
			await this.request(requestOptions, (chunk) => {
				chunk.copy(buffer, position);
				position += chunk.length;
			});
			if (position !== buffer.length) throw new Error(`Received data length ${position} is not equal to expected ${buffer.length}`);
			return buffer;
		}
		request(requestOptions, dataHandler) {
			return new Promise((resolve, reject) => {
				const request = this.httpExecutor.createRequest(requestOptions, (response) => {
					if (!(0, multipleRangeDownloader_1.checkIsRangesSupported)(response, reject)) return;
					response.on("error", reject);
					response.on("aborted", () => {
						reject(/* @__PURE__ */ new Error("response has been aborted by the server"));
					});
					response.on("data", dataHandler);
					response.on("end", () => resolve());
				});
				this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
				request.end();
			});
		}
	};
	exports.DifferentialDownloader = DifferentialDownloader;
	function formatBytes(value, symbol = " KB") {
		return new Intl.NumberFormat("en").format((value / 1024).toFixed(2)) + symbol;
	}
	function removeQuery(url) {
		const index = url.indexOf("?");
		return index < 0 ? url : url.substring(0, index);
	}
}));
//#endregion
//#region node_modules/electron-updater/out/differentialDownloader/GenericDifferentialDownloader.js
var require_GenericDifferentialDownloader = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GenericDifferentialDownloader = void 0;
	var DifferentialDownloader_1 = require_DifferentialDownloader();
	var GenericDifferentialDownloader = class extends DifferentialDownloader_1.DifferentialDownloader {
		download(oldBlockMap, newBlockMap) {
			return this.doDownload(oldBlockMap, newBlockMap);
		}
	};
	exports.GenericDifferentialDownloader = GenericDifferentialDownloader;
}));
//#endregion
//#region node_modules/electron-updater/out/types.js
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.UpdaterSignal = exports.UPDATE_DOWNLOADED = exports.DOWNLOAD_PROGRESS = exports.CancellationToken = void 0;
	exports.addHandler = addHandler;
	var builder_util_runtime_1 = require_out();
	Object.defineProperty(exports, "CancellationToken", {
		enumerable: true,
		get: function() {
			return builder_util_runtime_1.CancellationToken;
		}
	});
	exports.DOWNLOAD_PROGRESS = "download-progress";
	exports.UPDATE_DOWNLOADED = "update-downloaded";
	var UpdaterSignal = class {
		constructor(emitter) {
			this.emitter = emitter;
		}
		/**
		* Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
		*/
		login(handler) {
			addHandler(this.emitter, "login", handler);
		}
		progress(handler) {
			addHandler(this.emitter, exports.DOWNLOAD_PROGRESS, handler);
		}
		updateDownloaded(handler) {
			addHandler(this.emitter, exports.UPDATE_DOWNLOADED, handler);
		}
		updateCancelled(handler) {
			addHandler(this.emitter, "update-cancelled", handler);
		}
	};
	exports.UpdaterSignal = UpdaterSignal;
	function addHandler(emitter, event, handler) {
		emitter.on(event, handler);
	}
}));
//#endregion
//#region node_modules/electron-updater/out/AppUpdater.js
var require_AppUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoOpLogger = exports.AppUpdater = void 0;
	var builder_util_runtime_1 = require_out();
	var crypto_1$1 = __require("crypto");
	var os_1 = __require("os");
	var events_1 = __require("events");
	var fs_extra_1 = require_lib();
	var js_yaml_1 = require_js_yaml();
	var lazy_val_1 = require_main$1();
	var path$7 = __require("path");
	var semver_1 = require_semver();
	var DownloadedUpdateHelper_1 = require_DownloadedUpdateHelper();
	var ElectronAppAdapter_1 = require_ElectronAppAdapter();
	var electronHttpExecutor_1 = require_electronHttpExecutor();
	var GenericProvider_1 = require_GenericProvider();
	var providerFactory_1 = require_providerFactory();
	var zlib_1$1 = __require("zlib");
	var GenericDifferentialDownloader_1 = require_GenericDifferentialDownloader();
	var types_1 = require_types();
	exports.AppUpdater = class AppUpdater extends events_1.EventEmitter {
		/**
		* Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
		*/
		get channel() {
			return this._channel;
		}
		/**
		* Set the update channel. Overrides `channel` in the update configuration.
		*
		* `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
		*/
		set channel(value) {
			if (this._channel != null) {
				if (typeof value !== "string") throw (0, builder_util_runtime_1.newError)(`Channel must be a string, but got: ${value}`, "ERR_UPDATER_INVALID_CHANNEL");
				else if (value.length === 0) throw (0, builder_util_runtime_1.newError)(`Channel must be not an empty string`, "ERR_UPDATER_INVALID_CHANNEL");
			}
			this._channel = value;
			this.allowDowngrade = true;
		}
		/**
		*  Shortcut for explicitly adding auth tokens to request headers
		*/
		addAuthHeader(token) {
			this.requestHeaders = Object.assign({}, this.requestHeaders, { authorization: token });
		}
		get netSession() {
			return (0, electronHttpExecutor_1.getNetSession)();
		}
		/**
		* The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
		* Set it to `null` if you would like to disable a logging feature.
		*/
		get logger() {
			return this._logger;
		}
		set logger(value) {
			this._logger = value == null ? new NoOpLogger() : value;
		}
		/**
		* test only
		* @private
		*/
		set updateConfigPath(value) {
			this.clientPromise = null;
			this._appUpdateConfigPath = value;
			this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
		}
		/**
		* Allows developer to override default logic for determining if an update is supported.
		* The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
		*/
		get isUpdateSupported() {
			return this._isUpdateSupported;
		}
		set isUpdateSupported(value) {
			if (value) this._isUpdateSupported = value;
		}
		/**
		* Allows developer to override default logic for determining if the user is below the rollout threshold.
		* The default logic compares the staging percentage with numerical representation of user ID.
		* An override can define custom logic, or bypass it if needed.
		*/
		get isUserWithinRollout() {
			return this._isUserWithinRollout;
		}
		set isUserWithinRollout(value) {
			if (value) this._isUserWithinRollout = value;
		}
		constructor(options, app) {
			super();
			/**
			* Whether to automatically download an update when it is found.
			* @default true
			*/
			this.autoDownload = true;
			/**
			* Whether to automatically install a downloaded update on app quit (if `quitAndInstall` was not called before).
			* @default true
			*/
			this.autoInstallOnAppQuit = true;
			/**
			* Whether to run the app after finish install when run the installer is NOT in silent mode.
			* @default true
			*/
			this.autoRunAppAfterInstall = true;
			/**
			* *GitHub provider only.* Whether to allow update to pre-release versions. Defaults to `true` if application version contains prerelease components (e.g. `0.12.1-alpha.1`, here `alpha` is a prerelease component), otherwise `false`.
			*
			* If `true`, downgrade will be allowed (`allowDowngrade` will be set to `true`).
			*/
			this.allowPrerelease = false;
			/**
			* *GitHub provider only.* Get all release notes (from current version to latest), not just the latest.
			* @default false
			*/
			this.fullChangelog = false;
			/**
			* Whether to allow version downgrade (when a user from the beta channel wants to go back to the stable channel).
			*
			* Taken in account only if channel differs (pre-release version component in terms of semantic versioning).
			*
			* @default false
			*/
			this.allowDowngrade = false;
			/**
			* Web installer files might not have signature verification, this switch prevents to load them unless it is needed.
			*
			* Currently false to prevent breaking the current API, but it should be changed to default true at some point that
			* breaking changes are allowed.
			*
			* @default false
			*/
			this.disableWebInstaller = false;
			/**
			* *NSIS only* Disable differential downloads and always perform full download of installer.
			*
			* @default false
			*/
			this.disableDifferentialDownload = false;
			/**
			* Allows developer to force the updater to work in "dev" mode, looking for "dev-app-update.yml" instead of "app-update.yml"
			* Dev: `path.join(this.app.getAppPath(), "dev-app-update.yml")`
			* Prod: `path.join(process.resourcesPath!, "app-update.yml")`
			*
			* @default false
			*/
			this.forceDevUpdateConfig = false;
			/**
			* The base URL of the old block map file.
			*
			* When null, the updater will use the base URL of the update file to download the update.
			* When set, the updater will use this string as the base URL of the old block map file.
			* Some servers like github cannot download the old block map file from latest release,
			* so you need to compute the old block map file base URL manually.
			*
			* @default null
			*/
			this.previousBlockmapBaseUrlOverride = null;
			this._channel = null;
			this.downloadedUpdateHelper = null;
			/**
			*  The request headers.
			*/
			this.requestHeaders = null;
			this._logger = console;
			/**
			* For type safety you can use signals, e.g. `autoUpdater.signals.updateDownloaded(() => {})` instead of `autoUpdater.on('update-available', () => {})`
			*/
			this.signals = new types_1.UpdaterSignal(this);
			this._appUpdateConfigPath = null;
			this._isUpdateSupported = (updateInfo) => this.checkIfUpdateSupported(updateInfo);
			this._isUserWithinRollout = (updateInfo) => this.isStagingMatch(updateInfo);
			this.clientPromise = null;
			this.stagingUserIdPromise = new lazy_val_1.Lazy(() => this.getOrCreateStagingUserId());
			/** @internal */
			this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
			this.checkForUpdatesPromise = null;
			this.downloadPromise = null;
			this.updateInfoAndProvider = null;
			/**
			* @private
			* @internal
			*/
			this._testOnlyOptions = null;
			this.on("error", (error) => {
				this._logger.error(`Error: ${error.stack || error.message}`);
			});
			if (app == null) {
				this.app = new ElectronAppAdapter_1.ElectronAppAdapter();
				this.httpExecutor = new electronHttpExecutor_1.ElectronHttpExecutor((authInfo, callback) => this.emit("login", authInfo, callback));
			} else {
				this.app = app;
				this.httpExecutor = null;
			}
			const currentVersionString = this.app.version;
			const currentVersion = (0, semver_1.parse)(currentVersionString);
			if (currentVersion == null) throw (0, builder_util_runtime_1.newError)(`App version is not a valid semver version: "${currentVersionString}"`, "ERR_UPDATER_INVALID_VERSION");
			this.currentVersion = currentVersion;
			this.allowPrerelease = hasPrereleaseComponents(currentVersion);
			if (options != null) {
				this.setFeedURL(options);
				if (typeof options !== "string" && options.requestHeaders) this.requestHeaders = options.requestHeaders;
			}
		}
		getFeedURL() {
			return "Deprecated. Do not use it.";
		}
		/**
		* Configure update provider. If value is `string`, [GenericServerOptions](https://www.electron.build/publish#genericserveroptions) will be set with value as `url`.
		* @param options If you want to override configuration in the `app-update.yml`.
		*/
		setFeedURL(options) {
			const runtimeOptions = this.createProviderRuntimeOptions();
			let provider;
			if (typeof options === "string") provider = new GenericProvider_1.GenericProvider({
				provider: "generic",
				url: options
			}, this, {
				...runtimeOptions,
				isUseMultipleRangeRequest: (0, providerFactory_1.isUrlProbablySupportMultiRangeRequests)(options)
			});
			else provider = (0, providerFactory_1.createClient)(options, this, runtimeOptions);
			this.clientPromise = Promise.resolve(provider);
		}
		/**
		* Asks the server whether there is an update.
		* @returns null if the updater is disabled, otherwise info about the latest version
		*/
		checkForUpdates() {
			if (!this.isUpdaterActive()) return Promise.resolve(null);
			let checkForUpdatesPromise = this.checkForUpdatesPromise;
			if (checkForUpdatesPromise != null) {
				this._logger.info("Checking for update (already in progress)");
				return checkForUpdatesPromise;
			}
			const nullizePromise = () => this.checkForUpdatesPromise = null;
			this._logger.info("Checking for update");
			checkForUpdatesPromise = this.doCheckForUpdates().then((it) => {
				nullizePromise();
				return it;
			}).catch((e) => {
				nullizePromise();
				this.emit("error", e, `Cannot check for updates: ${(e.stack || e).toString()}`);
				throw e;
			});
			this.checkForUpdatesPromise = checkForUpdatesPromise;
			return checkForUpdatesPromise;
		}
		isUpdaterActive() {
			if (!(this.app.isPackaged || this.forceDevUpdateConfig)) {
				this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced");
				return false;
			}
			return true;
		}
		checkForUpdatesAndNotify(downloadNotification) {
			return this.checkForUpdates().then((it) => {
				if (!(it === null || it === void 0 ? void 0 : it.downloadPromise)) {
					if (this._logger.debug != null) this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null");
					return it;
				}
				it.downloadPromise.then(() => {
					const notificationContent = AppUpdater.formatDownloadNotification(it.updateInfo.version, this.app.name, downloadNotification);
					new (__require("electron")).Notification(notificationContent).show();
				});
				return it;
			});
		}
		static formatDownloadNotification(version, appName, downloadNotification) {
			if (downloadNotification == null) downloadNotification = {
				title: "A new update is ready to install",
				body: `{appName} version {version} has been downloaded and will be automatically installed on exit`
			};
			downloadNotification = {
				title: downloadNotification.title.replace("{appName}", appName).replace("{version}", version),
				body: downloadNotification.body.replace("{appName}", appName).replace("{version}", version)
			};
			return downloadNotification;
		}
		async isStagingMatch(updateInfo) {
			const rawStagingPercentage = updateInfo.stagingPercentage;
			let stagingPercentage = rawStagingPercentage;
			if (stagingPercentage == null) return true;
			stagingPercentage = parseInt(stagingPercentage, 10);
			if (isNaN(stagingPercentage)) {
				this._logger.warn(`Staging percentage is NaN: ${rawStagingPercentage}`);
				return true;
			}
			stagingPercentage = stagingPercentage / 100;
			const stagingUserId = await this.stagingUserIdPromise.value;
			const percentage = builder_util_runtime_1.UUID.parse(stagingUserId).readUInt32BE(12) / 4294967295;
			this._logger.info(`Staging percentage: ${stagingPercentage}, percentage: ${percentage}, user id: ${stagingUserId}`);
			return percentage < stagingPercentage;
		}
		computeFinalHeaders(headers) {
			if (this.requestHeaders != null) Object.assign(headers, this.requestHeaders);
			return headers;
		}
		async isUpdateAvailable(updateInfo) {
			const latestVersion = (0, semver_1.parse)(updateInfo.version);
			if (latestVersion == null) throw (0, builder_util_runtime_1.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${updateInfo.version}"`, "ERR_UPDATER_INVALID_VERSION");
			const currentVersion = this.currentVersion;
			if ((0, semver_1.eq)(latestVersion, currentVersion)) return false;
			if (!await Promise.resolve(this.isUpdateSupported(updateInfo))) return false;
			if (!await Promise.resolve(this.isUserWithinRollout(updateInfo))) return false;
			const isLatestVersionNewer = (0, semver_1.gt)(latestVersion, currentVersion);
			const isLatestVersionOlder = (0, semver_1.lt)(latestVersion, currentVersion);
			if (isLatestVersionNewer) return true;
			return this.allowDowngrade && isLatestVersionOlder;
		}
		checkIfUpdateSupported(updateInfo) {
			const minimumSystemVersion = updateInfo === null || updateInfo === void 0 ? void 0 : updateInfo.minimumSystemVersion;
			const currentOSVersion = (0, os_1.release)();
			if (minimumSystemVersion) try {
				if ((0, semver_1.lt)(currentOSVersion, minimumSystemVersion)) {
					this._logger.info(`Current OS version ${currentOSVersion} is less than the minimum OS version required ${minimumSystemVersion} for version ${currentOSVersion}`);
					return false;
				}
			} catch (e) {
				this._logger.warn(`Failed to compare current OS version(${currentOSVersion}) with minimum OS version(${minimumSystemVersion}): ${(e.message || e).toString()}`);
			}
			return true;
		}
		async getUpdateInfoAndProvider() {
			await this.app.whenReady();
			if (this.clientPromise == null) this.clientPromise = this.configOnDisk.value.then((it) => (0, providerFactory_1.createClient)(it, this, this.createProviderRuntimeOptions()));
			const client = await this.clientPromise;
			const stagingUserId = await this.stagingUserIdPromise.value;
			client.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": stagingUserId }));
			return {
				info: await client.getLatestVersion(),
				provider: client
			};
		}
		createProviderRuntimeOptions() {
			return {
				isUseMultipleRangeRequest: true,
				platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
				executor: this.httpExecutor
			};
		}
		async doCheckForUpdates() {
			this.emit("checking-for-update");
			const result = await this.getUpdateInfoAndProvider();
			const updateInfo = result.info;
			if (!await this.isUpdateAvailable(updateInfo)) {
				this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${updateInfo.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`);
				this.emit("update-not-available", updateInfo);
				return {
					isUpdateAvailable: false,
					versionInfo: updateInfo,
					updateInfo
				};
			}
			this.updateInfoAndProvider = result;
			this.onUpdateAvailable(updateInfo);
			const cancellationToken = new builder_util_runtime_1.CancellationToken();
			return {
				isUpdateAvailable: true,
				versionInfo: updateInfo,
				updateInfo,
				cancellationToken,
				downloadPromise: this.autoDownload ? this.downloadUpdate(cancellationToken) : null
			};
		}
		onUpdateAvailable(updateInfo) {
			this._logger.info(`Found version ${updateInfo.version} (url: ${(0, builder_util_runtime_1.asArray)(updateInfo.files).map((it) => it.url).join(", ")})`);
			this.emit("update-available", updateInfo);
		}
		/**
		* Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
		* @returns {Promise<Array<string>>} Paths to downloaded files.
		*/
		downloadUpdate(cancellationToken = new builder_util_runtime_1.CancellationToken()) {
			const updateInfoAndProvider = this.updateInfoAndProvider;
			if (updateInfoAndProvider == null) {
				const error = /* @__PURE__ */ new Error("Please check update first");
				this.dispatchError(error);
				return Promise.reject(error);
			}
			if (this.downloadPromise != null) {
				this._logger.info("Downloading update (already in progress)");
				return this.downloadPromise;
			}
			this._logger.info(`Downloading update from ${(0, builder_util_runtime_1.asArray)(updateInfoAndProvider.info.files).map((it) => it.url).join(", ")}`);
			const errorHandler = (e) => {
				if (!(e instanceof builder_util_runtime_1.CancellationError)) try {
					this.dispatchError(e);
				} catch (nestedError) {
					this._logger.warn(`Cannot dispatch error event: ${nestedError.stack || nestedError}`);
				}
				return e;
			};
			this.downloadPromise = this.doDownloadUpdate({
				updateInfoAndProvider,
				requestHeaders: this.computeRequestHeaders(updateInfoAndProvider.provider),
				cancellationToken,
				disableWebInstaller: this.disableWebInstaller,
				disableDifferentialDownload: this.disableDifferentialDownload
			}).catch((e) => {
				throw errorHandler(e);
			}).finally(() => {
				this.downloadPromise = null;
			});
			return this.downloadPromise;
		}
		dispatchError(e) {
			this.emit("error", e, (e.stack || e).toString());
		}
		dispatchUpdateDownloaded(event) {
			this.emit(types_1.UPDATE_DOWNLOADED, event);
		}
		async loadUpdateConfig() {
			if (this._appUpdateConfigPath == null) this._appUpdateConfigPath = this.app.appUpdateConfigPath;
			return (0, js_yaml_1.load)(await (0, fs_extra_1.readFile)(this._appUpdateConfigPath, "utf-8"));
		}
		computeRequestHeaders(provider) {
			const fileExtraDownloadHeaders = provider.fileExtraDownloadHeaders;
			if (fileExtraDownloadHeaders != null) {
				const requestHeaders = this.requestHeaders;
				return requestHeaders == null ? fileExtraDownloadHeaders : {
					...fileExtraDownloadHeaders,
					...requestHeaders
				};
			}
			return this.computeFinalHeaders({ accept: "*/*" });
		}
		async getOrCreateStagingUserId() {
			const file = path$7.join(this.app.userDataPath, ".updaterId");
			try {
				const id = await (0, fs_extra_1.readFile)(file, "utf-8");
				if (builder_util_runtime_1.UUID.check(id)) return id;
				else this._logger.warn(`Staging user id file exists, but content was invalid: ${id}`);
			} catch (e) {
				if (e.code !== "ENOENT") this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${e}`);
			}
			const id = builder_util_runtime_1.UUID.v5((0, crypto_1$1.randomBytes)(4096), builder_util_runtime_1.UUID.OID);
			this._logger.info(`Generated new staging user ID: ${id}`);
			try {
				await (0, fs_extra_1.outputFile)(file, id);
			} catch (e) {
				this._logger.warn(`Couldn't write out staging user ID: ${e}`);
			}
			return id;
		}
		/** @internal */
		get isAddNoCacheQuery() {
			const headers = this.requestHeaders;
			if (headers == null) return true;
			for (const headerName of Object.keys(headers)) {
				const s = headerName.toLowerCase();
				if (s === "authorization" || s === "private-token") return false;
			}
			return true;
		}
		async getOrCreateDownloadHelper() {
			let result = this.downloadedUpdateHelper;
			if (result == null) {
				const dirName = (await this.configOnDisk.value).updaterCacheDirName;
				const logger = this._logger;
				if (dirName == null) logger.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
				const cacheDir = path$7.join(this.app.baseCachePath, dirName || this.app.name);
				if (logger.debug != null) logger.debug(`updater cache dir: ${cacheDir}`);
				result = new DownloadedUpdateHelper_1.DownloadedUpdateHelper(cacheDir);
				this.downloadedUpdateHelper = result;
			}
			return result;
		}
		async executeDownload(taskOptions) {
			const fileInfo = taskOptions.fileInfo;
			const downloadOptions = {
				headers: taskOptions.downloadUpdateOptions.requestHeaders,
				cancellationToken: taskOptions.downloadUpdateOptions.cancellationToken,
				sha2: fileInfo.info.sha2,
				sha512: fileInfo.info.sha512
			};
			if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
			const updateInfo = taskOptions.downloadUpdateOptions.updateInfoAndProvider.info;
			const version = updateInfo.version;
			const packageInfo = fileInfo.packageInfo;
			function getCacheUpdateFileName() {
				const urlPath = decodeURIComponent(taskOptions.fileInfo.url.pathname);
				if (urlPath.toLowerCase().endsWith(`.${taskOptions.fileExtension.toLowerCase()}`)) return path$7.basename(urlPath);
				else return path$7.basename(taskOptions.fileInfo.info.url);
			}
			const downloadedUpdateHelper = await this.getOrCreateDownloadHelper();
			const cacheDir = downloadedUpdateHelper.cacheDirForPendingUpdate;
			await (0, fs_extra_1.mkdir)(cacheDir, { recursive: true });
			const updateFileName = getCacheUpdateFileName();
			let updateFile = path$7.join(cacheDir, updateFileName);
			const packageFile = packageInfo == null ? null : path$7.join(cacheDir, `package-${version}${path$7.extname(packageInfo.path) || ".7z"}`);
			const done = async (isSaveCache) => {
				await downloadedUpdateHelper.setDownloadedFile(updateFile, packageFile, updateInfo, fileInfo, updateFileName, isSaveCache);
				await taskOptions.done({
					...updateInfo,
					downloadedFile: updateFile
				});
				const currentBlockMapFile = path$7.join(cacheDir, "current.blockmap");
				if (await (0, fs_extra_1.pathExists)(currentBlockMapFile)) await (0, fs_extra_1.copyFile)(currentBlockMapFile, path$7.join(downloadedUpdateHelper.cacheDir, "current.blockmap"));
				return packageFile == null ? [updateFile] : [updateFile, packageFile];
			};
			const log = this._logger;
			const cachedUpdateFile = await downloadedUpdateHelper.validateDownloadedPath(updateFile, updateInfo, fileInfo, log);
			if (cachedUpdateFile != null) {
				updateFile = cachedUpdateFile;
				return await done(false);
			}
			const removeFileIfAny = async () => {
				await downloadedUpdateHelper.clear().catch(() => {});
				return await (0, fs_extra_1.unlink)(updateFile).catch(() => {});
			};
			const tempUpdateFile = await (0, DownloadedUpdateHelper_1.createTempUpdateFile)(`temp-${updateFileName}`, cacheDir, log);
			try {
				await taskOptions.task(tempUpdateFile, downloadOptions, packageFile, removeFileIfAny);
				await (0, builder_util_runtime_1.retry)(() => (0, fs_extra_1.rename)(tempUpdateFile, updateFile), {
					retries: 60,
					interval: 500,
					shouldRetry: (error) => {
						if (error instanceof Error && /^EBUSY:/.test(error.message)) return true;
						log.warn(`Cannot rename temp file to final file: ${error.message || error.stack}`);
						return false;
					}
				});
			} catch (e) {
				await removeFileIfAny();
				if (e instanceof builder_util_runtime_1.CancellationError) {
					log.info("cancelled");
					this.emit("update-cancelled", updateInfo);
				}
				throw e;
			}
			log.info(`New version ${version} has been downloaded to ${updateFile}`);
			return await done(true);
		}
		async differentialDownloadInstaller(fileInfo, downloadUpdateOptions, installerPath, provider, oldInstallerFileName) {
			try {
				if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload) return true;
				const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
				const blockmapFileUrls = await provider.getBlockMapFiles(fileInfo.url, this.app.version, downloadUpdateOptions.updateInfoAndProvider.info.version, this.previousBlockmapBaseUrlOverride);
				this._logger.info(`Download block maps (old: "${blockmapFileUrls[0]}", new: ${blockmapFileUrls[1]})`);
				const downloadBlockMap = async (url) => {
					const data = await this.httpExecutor.downloadToBuffer(url, {
						headers: downloadUpdateOptions.requestHeaders,
						cancellationToken: downloadUpdateOptions.cancellationToken
					});
					if (data == null || data.length === 0) throw new Error(`Blockmap "${url.href}" is empty`);
					try {
						return JSON.parse((0, zlib_1$1.gunzipSync)(data).toString());
					} catch (e) {
						throw new Error(`Cannot parse blockmap "${url.href}", error: ${e}`);
					}
				};
				const downloadOptions = {
					newUrl: fileInfo.url,
					oldFile: path$7.join(this.downloadedUpdateHelper.cacheDir, oldInstallerFileName),
					logger: this._logger,
					newFile: installerPath,
					isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
					requestHeaders: downloadUpdateOptions.requestHeaders,
					cancellationToken: downloadUpdateOptions.cancellationToken
				};
				if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
				const saveBlockMapToCacheDir = async (blockMapData, cacheDir) => {
					const blockMapFile = path$7.join(cacheDir, "current.blockmap");
					await (0, fs_extra_1.outputFile)(blockMapFile, (0, zlib_1$1.gzipSync)(JSON.stringify(blockMapData)));
				};
				const getBlockMapFromCacheDir = async (cacheDir) => {
					const blockMapFile = path$7.join(cacheDir, "current.blockmap");
					try {
						if (await (0, fs_extra_1.pathExists)(blockMapFile)) return JSON.parse((0, zlib_1$1.gunzipSync)(await (0, fs_extra_1.readFile)(blockMapFile)).toString());
					} catch (e) {
						this._logger.warn(`Cannot parse blockmap "${blockMapFile}", error: ${e}`);
					}
					return null;
				};
				const newBlockMapData = await downloadBlockMap(blockmapFileUrls[1]);
				await saveBlockMapToCacheDir(newBlockMapData, this.downloadedUpdateHelper.cacheDirForPendingUpdate);
				let oldBlockMapData = await getBlockMapFromCacheDir(this.downloadedUpdateHelper.cacheDir);
				if (oldBlockMapData == null) oldBlockMapData = await downloadBlockMap(blockmapFileUrls[0]);
				await new GenericDifferentialDownloader_1.GenericDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download(oldBlockMapData, newBlockMapData);
				return false;
			} catch (e) {
				this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
				if (this._testOnlyOptions != null) throw e;
				return true;
			}
		}
	};
	function hasPrereleaseComponents(version) {
		const versionPrereleaseComponent = (0, semver_1.prerelease)(version);
		return versionPrereleaseComponent != null && versionPrereleaseComponent.length > 0;
	}
	/** @private */
	var NoOpLogger = class {
		info(message) {}
		warn(message) {}
		error(message) {}
	};
	exports.NoOpLogger = NoOpLogger;
}));
//#endregion
//#region node_modules/electron-updater/out/BaseUpdater.js
var require_BaseUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BaseUpdater = void 0;
	var child_process_1$3 = __require("child_process");
	var path$6 = __require("path");
	var AppUpdater_1 = require_AppUpdater();
	var BaseUpdater = class extends AppUpdater_1.AppUpdater {
		constructor(options, app) {
			super(options, app);
			this.quitAndInstallCalled = false;
			this.quitHandlerAdded = false;
		}
		quitAndInstall(isSilent = false, isForceRunAfter = false) {
			this._logger.info(`Install on explicit quitAndInstall`);
			if (this.install(isSilent, isSilent ? isForceRunAfter : this.autoRunAppAfterInstall)) setImmediate(() => {
				__require("electron").autoUpdater.emit("before-quit-for-update");
				this.app.quit();
			});
			else this.quitAndInstallCalled = false;
		}
		executeDownload(taskOptions) {
			return super.executeDownload({
				...taskOptions,
				done: (event) => {
					this.dispatchUpdateDownloaded(event);
					this.addQuitHandler();
					return Promise.resolve();
				}
			});
		}
		get installerPath() {
			return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
		}
		install(isSilent = false, isForceRunAfter = false) {
			if (this.quitAndInstallCalled) {
				this._logger.warn("install call ignored: quitAndInstallCalled is set to true");
				return false;
			}
			const downloadedUpdateHelper = this.downloadedUpdateHelper;
			const installerPath = this.installerPath;
			const downloadedFileInfo = downloadedUpdateHelper == null ? null : downloadedUpdateHelper.downloadedFileInfo;
			if (installerPath == null || downloadedFileInfo == null) {
				this.dispatchError(/* @__PURE__ */ new Error("No update filepath provided, can't quit and install"));
				return false;
			}
			this.quitAndInstallCalled = true;
			try {
				this._logger.info(`Install: isSilent: ${isSilent}, isForceRunAfter: ${isForceRunAfter}`);
				return this.doInstall({
					isSilent,
					isForceRunAfter,
					isAdminRightsRequired: downloadedFileInfo.isAdminRightsRequired
				});
			} catch (e) {
				this.dispatchError(e);
				return false;
			}
		}
		addQuitHandler() {
			if (this.quitHandlerAdded || !this.autoInstallOnAppQuit) return;
			this.quitHandlerAdded = true;
			this.app.onQuit((exitCode) => {
				if (this.quitAndInstallCalled) {
					this._logger.info("Update installer has already been triggered. Quitting application.");
					return;
				}
				if (!this.autoInstallOnAppQuit) {
					this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
					return;
				}
				if (exitCode !== 0) {
					this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${exitCode}`);
					return;
				}
				this._logger.info("Auto install update on quit");
				this.install(true, false);
			});
		}
		/**
		* Strips relative-path entries from a PATH string.
		* Prevents PATH-poisoning where a writable directory earlier in PATH shadows
		* a trusted package manager binary.
		*/
		sanitizeEnvPath(envPath) {
			return envPath.split(path$6.delimiter).filter((dir) => path$6.isAbsolute(dir)).join(path$6.delimiter);
		}
		spawnSyncLog(cmd, args = [], env = {}) {
			var _a;
			this._logger.info(`Executing: ${cmd} with args: ${args}`);
			const mergedEnv = {
				...process.env,
				...env
			};
			const { error, status, stdout, stderr } = (0, child_process_1$3.spawnSync)(cmd, args, {
				env: {
					...mergedEnv,
					PATH: this.sanitizeEnvPath((_a = mergedEnv.PATH) !== null && _a !== void 0 ? _a : "")
				},
				encoding: "utf-8",
				shell: true
			});
			if (error != null) {
				this._logger.error(stderr);
				throw error;
			} else if (status != null && status !== 0) {
				this._logger.error(stderr);
				throw new Error(`Command ${cmd} exited with code ${status}`);
			}
			return stdout.trim();
		}
		/**
		* This handles both node 8 and node 10 way of emitting error when spawning a process
		*   - node 8: Throws the error
		*   - node 10: Emit the error(Need to listen with on)
		*/
		async spawnLog(cmd, args = [], env = void 0, stdio = "ignore") {
			this._logger.info(`Executing: ${cmd} with args: ${args}`);
			return new Promise((resolve, reject) => {
				try {
					const params = {
						stdio,
						env,
						detached: true
					};
					const p = (0, child_process_1$3.spawn)(cmd, args, params);
					p.on("error", (error) => {
						reject(error);
					});
					p.unref();
					if (p.pid !== void 0) resolve(true);
				} catch (error) {
					reject(error);
				}
			});
		}
	};
	exports.BaseUpdater = BaseUpdater;
}));
//#endregion
//#region node_modules/electron-updater/out/differentialDownloader/FileWithEmbeddedBlockMapDifferentialDownloader.js
var require_FileWithEmbeddedBlockMapDifferentialDownloader = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
	var fs_extra_1 = require_lib();
	var DifferentialDownloader_1 = require_DifferentialDownloader();
	var zlib_1 = __require("zlib");
	var FileWithEmbeddedBlockMapDifferentialDownloader = class extends DifferentialDownloader_1.DifferentialDownloader {
		async download() {
			const packageInfo = this.blockAwareFileInfo;
			const fileSize = packageInfo.size;
			const offset = fileSize - (packageInfo.blockMapSize + 4);
			this.fileMetadataBuffer = await this.readRemoteBytes(offset, fileSize - 1);
			const newBlockMap = readBlockMap(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
			await this.doDownload(await readEmbeddedBlockMapData(this.options.oldFile), newBlockMap);
		}
	};
	exports.FileWithEmbeddedBlockMapDifferentialDownloader = FileWithEmbeddedBlockMapDifferentialDownloader;
	function readBlockMap(data) {
		return JSON.parse((0, zlib_1.inflateRawSync)(data).toString());
	}
	async function readEmbeddedBlockMapData(file) {
		const fd = await (0, fs_extra_1.open)(file, "r");
		try {
			const fileSize = (await (0, fs_extra_1.fstat)(fd)).size;
			const sizeBuffer = Buffer.allocUnsafe(4);
			await (0, fs_extra_1.read)(fd, sizeBuffer, 0, sizeBuffer.length, fileSize - sizeBuffer.length);
			const dataBuffer = Buffer.allocUnsafe(sizeBuffer.readUInt32BE(0));
			await (0, fs_extra_1.read)(fd, dataBuffer, 0, dataBuffer.length, fileSize - sizeBuffer.length - dataBuffer.length);
			await (0, fs_extra_1.close)(fd);
			return readBlockMap(dataBuffer);
		} catch (e) {
			await (0, fs_extra_1.close)(fd);
			throw e;
		}
	}
}));
//#endregion
//#region node_modules/electron-updater/out/AppImageUpdater.js
var require_AppImageUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.AppImageUpdater = void 0;
	var builder_util_runtime_1 = require_out();
	var child_process_1$2 = __require("child_process");
	var fs_extra_1 = require_lib();
	var fs_1$1 = __require("fs");
	var path$5 = __require("path");
	var BaseUpdater_1 = require_BaseUpdater();
	var FileWithEmbeddedBlockMapDifferentialDownloader_1 = require_FileWithEmbeddedBlockMapDifferentialDownloader();
	var Provider_1 = require_Provider();
	var types_1 = require_types();
	var AppImageUpdater = class extends BaseUpdater_1.BaseUpdater {
		constructor(options, app) {
			super(options, app);
		}
		isUpdaterActive() {
			if (process.env["APPIMAGE"] == null && !this.forceDevUpdateConfig) {
				if (process.env["SNAP"] == null) this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage");
				else this._logger.info("SNAP env is defined, updater is disabled");
				return false;
			}
			return super.isUpdaterActive();
		}
		/*** @private */
		doDownloadUpdate(downloadUpdateOptions) {
			const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
			const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "AppImage", [
				"rpm",
				"deb",
				"pacman"
			]);
			return this.executeDownload({
				fileExtension: "AppImage",
				fileInfo,
				downloadUpdateOptions,
				task: async (updateFile, downloadOptions) => {
					const oldFile = process.env["APPIMAGE"];
					if (oldFile == null) throw (0, builder_util_runtime_1.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
					if (downloadUpdateOptions.disableDifferentialDownload || await this.downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions)) await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
					await (0, fs_extra_1.chmod)(updateFile, 493);
				}
			});
		}
		async downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions) {
			try {
				const downloadOptions = {
					newUrl: fileInfo.url,
					oldFile,
					logger: this._logger,
					newFile: updateFile,
					isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
					requestHeaders: downloadUpdateOptions.requestHeaders,
					cancellationToken: downloadUpdateOptions.cancellationToken
				};
				if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
				await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download();
				return false;
			} catch (e) {
				this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
				return process.platform === "linux";
			}
		}
		doInstall(options) {
			const appImageFile = process.env["APPIMAGE"];
			if (appImageFile == null) throw (0, builder_util_runtime_1.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
			if (!path$5.isAbsolute(appImageFile) || appImageFile.includes("\0")) throw (0, builder_util_runtime_1.newError)(`APPIMAGE env is not a valid absolute path: "${appImageFile}"`, "ERR_UPDATER_OLD_FILE_NOT_FOUND");
			(0, fs_1$1.unlinkSync)(appImageFile);
			let destination;
			const existingBaseName = path$5.basename(appImageFile);
			const installerPath = this.installerPath;
			if (installerPath == null) {
				this.dispatchError(/* @__PURE__ */ new Error("No update filepath provided, can't quit and install"));
				return false;
			}
			if (path$5.basename(installerPath) === existingBaseName || !/\d+\.\d+\.\d+/.test(existingBaseName)) destination = appImageFile;
			else destination = path$5.join(path$5.dirname(appImageFile), path$5.basename(installerPath));
			(0, child_process_1$2.execFileSync)("mv", [
				"-f",
				installerPath,
				destination
			]);
			if (destination !== appImageFile) this.emit("appimage-filename-updated", destination);
			const env = {
				...process.env,
				APPIMAGE_SILENT_INSTALL: "true"
			};
			if (options.isForceRunAfter) this.spawnLog(destination, [], env);
			else {
				env.APPIMAGE_EXIT_AFTER_INSTALL = "true";
				(0, child_process_1$2.execFileSync)(destination, [], { env });
			}
			return true;
		}
	};
	exports.AppImageUpdater = AppImageUpdater;
}));
//#endregion
//#region node_modules/electron-updater/out/LinuxUpdater.js
var require_LinuxUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.LinuxUpdater = void 0;
	var BaseUpdater_1 = require_BaseUpdater();
	var SAFE_PM_REGEX = /^[a-zA-Z0-9_-]+$/;
	var LinuxUpdater = class extends BaseUpdater_1.BaseUpdater {
		constructor(options, app) {
			super(options, app);
		}
		/**
		* Returns true if the current process is running as root.
		*/
		isRunningAsRoot() {
			var _a;
			return ((_a = process.getuid) === null || _a === void 0 ? void 0 : _a.call(process)) === 0;
		}
		/**
		* Sanitizes the installer path for use with shell:true spawn calls.
		* Backslash-escapes metacharacters that have special meaning in POSIX shell.
		* Note: paths containing single-quotes (') are not supported.
		*/
		get installerPath() {
			const raw = super.installerPath;
			if (raw == null) return null;
			return raw.replace(/\\/g, "\\\\").replace(/([`$!" ;|&()<>])/g, "\\$1").replace(/[\n\r]/g, "");
		}
		runCommandWithSudoIfNeeded(commandWithArgs) {
			if (this.isRunningAsRoot()) {
				this._logger.info("Running as root, no need to use sudo");
				return this.spawnSyncLog(commandWithArgs[0], commandWithArgs.slice(1));
			}
			const { name } = this.app;
			const installComment = `"${name.replace(/["`$\\!\n\r;|&<>(){}*?[\]#~]/g, "")} would like to update"`;
			const sudo = this.sudoWithArgs(installComment);
			this._logger.info(`Running as non-root user, using sudo to install: ${sudo}`);
			let wrapper = `"`;
			if (/pkexec/i.test(sudo[0]) || sudo[0] === "sudo") wrapper = "";
			return this.spawnSyncLog(sudo[0], [
				...sudo.length > 1 ? sudo.slice(1) : [],
				`${wrapper}/bin/bash`,
				"-c",
				`'${commandWithArgs.join(" ")}'${wrapper}`
			]);
		}
		sudoWithArgs(installComment) {
			const sudo = this.determineSudoCommand();
			const command = [sudo];
			if (/kdesudo/i.test(sudo)) {
				command.push("--comment", installComment);
				command.push("-c");
			} else if (/gksudo/i.test(sudo)) command.push("--message", installComment);
			else if (/pkexec/i.test(sudo)) command.push("--disable-internal-agent");
			return command;
		}
		hasCommand(cmd) {
			try {
				this.spawnSyncLog(`command`, ["-v", cmd]);
				return true;
			} catch {
				return false;
			}
		}
		determineSudoCommand() {
			for (const sudo of [
				"gksudo",
				"kdesudo",
				"pkexec",
				"beesu"
			]) if (this.hasCommand(sudo)) return sudo;
			return "sudo";
		}
		/**
		* Detects the package manager to use based on the available commands.
		* Allows overriding the default behavior by setting the ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER environment variable.
		* If the environment variable is set, it will be used directly. (This is useful for testing each package manager logic path.)
		* Otherwise, it checks for the presence of the specified package manager commands in the order provided.
		* @param pms - An array of package manager commands to check for, in priority order.
		* @returns The detected package manager command or "unknown" if none are found.
		*/
		detectPackageManager(pms) {
			var _a;
			let availablePMs = pms;
			const pmOverride = (_a = process.env.ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER) === null || _a === void 0 ? void 0 : _a.trim();
			if (pmOverride) {
				if (!SAFE_PM_REGEX.test(pmOverride)) this._logger.warn(`ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER "${pmOverride}" contains unsafe characters. Ignoring override.`);
				else availablePMs = [pmOverride];
			}
			for (const pm of availablePMs) if (this.hasCommand(pm)) return pm;
			const searchList = pmOverride ? `ELECTRON_BUILDER_LINUX_PACKAGE_MANAGER override "${pmOverride}", ` : "";
			const defaultPM = pms[0];
			this._logger.warn(`No package manager found in the list: ${searchList}${pms.join(", ")}. Utilizing default: ${defaultPM}`);
			return defaultPM;
		}
	};
	exports.LinuxUpdater = LinuxUpdater;
}));
//#endregion
//#region node_modules/electron-updater/out/DebUpdater.js
var require_DebUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DebUpdater = void 0;
	var Provider_1 = require_Provider();
	var types_1 = require_types();
	var LinuxUpdater_1 = require_LinuxUpdater();
	exports.DebUpdater = class DebUpdater extends LinuxUpdater_1.LinuxUpdater {
		constructor(options, app) {
			super(options, app);
		}
		/*** @private */
		doDownloadUpdate(downloadUpdateOptions) {
			const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
			const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "deb", [
				"AppImage",
				"rpm",
				"pacman"
			]);
			return this.executeDownload({
				fileExtension: "deb",
				fileInfo,
				downloadUpdateOptions,
				task: async (updateFile, downloadOptions) => {
					if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
					await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
				}
			});
		}
		doInstall(options) {
			const installerPath = this.installerPath;
			if (installerPath == null) {
				this.dispatchError(/* @__PURE__ */ new Error("No update filepath provided, can't quit and install"));
				return false;
			}
			if (!this.hasCommand("dpkg") && !this.hasCommand("apt")) {
				this.dispatchError(/* @__PURE__ */ new Error("Neither dpkg nor apt command found. Cannot install .deb package."));
				return false;
			}
			const packageManager = this.detectPackageManager(["dpkg", "apt"]);
			try {
				DebUpdater.installWithCommandRunner(packageManager, installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
			} catch (error) {
				this.dispatchError(error);
				return false;
			}
			if (options.isForceRunAfter) this.app.relaunch();
			return true;
		}
		static installWithCommandRunner(packageManager, installerPath, commandRunner, logger) {
			var _a;
			if (packageManager === "dpkg") try {
				commandRunner([
					"dpkg",
					"-i",
					installerPath
				]);
			} catch (error) {
				logger.warn((_a = error.message) !== null && _a !== void 0 ? _a : error);
				logger.warn("dpkg installation failed, trying to fix broken dependencies with apt-get");
				commandRunner([
					"apt-get",
					"install",
					"-f",
					"-y"
				]);
			}
			else if (packageManager === "apt") {
				logger.warn("Using apt to install a local .deb. This may fail for unsigned packages unless properly configured.");
				commandRunner([
					"apt",
					"install",
					"-y",
					"--allow-unauthenticated",
					"--allow-downgrades",
					"--allow-change-held-packages",
					installerPath
				]);
			} else throw new Error(`Package manager ${packageManager} not supported`);
		}
	};
}));
//#endregion
//#region node_modules/electron-updater/out/PacmanUpdater.js
var require_PacmanUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PacmanUpdater = void 0;
	var types_1 = require_types();
	var Provider_1 = require_Provider();
	var LinuxUpdater_1 = require_LinuxUpdater();
	exports.PacmanUpdater = class PacmanUpdater extends LinuxUpdater_1.LinuxUpdater {
		constructor(options, app) {
			super(options, app);
		}
		/*** @private */
		doDownloadUpdate(downloadUpdateOptions) {
			const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
			const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "pacman", [
				"AppImage",
				"deb",
				"rpm"
			]);
			return this.executeDownload({
				fileExtension: "pacman",
				fileInfo,
				downloadUpdateOptions,
				task: async (updateFile, downloadOptions) => {
					if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
					await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
				}
			});
		}
		doInstall(options) {
			const installerPath = this.installerPath;
			if (installerPath == null) {
				this.dispatchError(/* @__PURE__ */ new Error("No update filepath provided, can't quit and install"));
				return false;
			}
			try {
				PacmanUpdater.installWithCommandRunner(installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
			} catch (error) {
				this.dispatchError(error);
				return false;
			}
			if (options.isForceRunAfter) this.app.relaunch();
			return true;
		}
		static installWithCommandRunner(installerPath, commandRunner, logger) {
			var _a;
			try {
				commandRunner([
					"pacman",
					"-U",
					"--noconfirm",
					installerPath
				]);
			} catch (error) {
				logger.warn((_a = error.message) !== null && _a !== void 0 ? _a : error);
				logger.warn("pacman installation failed, attempting to update package database and retry");
				try {
					commandRunner([
						"pacman",
						"-Sy",
						"--noconfirm"
					]);
					commandRunner([
						"pacman",
						"-U",
						"--noconfirm",
						installerPath
					]);
				} catch (retryError) {
					logger.error("Retry after pacman -Sy failed");
					throw retryError;
				}
			}
		}
	};
}));
//#endregion
//#region node_modules/electron-updater/out/RpmUpdater.js
var require_RpmUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.RpmUpdater = void 0;
	var types_1 = require_types();
	var Provider_1 = require_Provider();
	var LinuxUpdater_1 = require_LinuxUpdater();
	exports.RpmUpdater = class RpmUpdater extends LinuxUpdater_1.LinuxUpdater {
		constructor(options, app) {
			super(options, app);
		}
		/*** @private */
		doDownloadUpdate(downloadUpdateOptions) {
			const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
			const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "rpm", [
				"AppImage",
				"deb",
				"pacman"
			]);
			return this.executeDownload({
				fileExtension: "rpm",
				fileInfo,
				downloadUpdateOptions,
				task: async (updateFile, downloadOptions) => {
					if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
					await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
				}
			});
		}
		doInstall(options) {
			const installerPath = this.installerPath;
			if (installerPath == null) {
				this.dispatchError(/* @__PURE__ */ new Error("No update filepath provided, can't quit and install"));
				return false;
			}
			const packageManager = this.detectPackageManager([
				"zypper",
				"dnf",
				"yum",
				"rpm"
			]);
			try {
				RpmUpdater.installWithCommandRunner(packageManager, installerPath, this.runCommandWithSudoIfNeeded.bind(this), this._logger);
			} catch (error) {
				this.dispatchError(error);
				return false;
			}
			if (options.isForceRunAfter) this.app.relaunch();
			return true;
		}
		static installWithCommandRunner(packageManager, installerPath, commandRunner, logger) {
			if (packageManager === "zypper") return commandRunner([
				"zypper",
				"--non-interactive",
				"--no-refresh",
				"install",
				"--allow-unsigned-rpm",
				"-f",
				installerPath
			]);
			if (packageManager === "dnf") return commandRunner([
				"dnf",
				"install",
				"--nogpgcheck",
				"-y",
				installerPath
			]);
			if (packageManager === "yum") return commandRunner([
				"yum",
				"install",
				"--nogpgcheck",
				"-y",
				installerPath
			]);
			if (packageManager === "rpm") {
				logger.warn("Installing with rpm only (no dependency resolution).");
				return commandRunner([
					"rpm",
					"-Uvh",
					"--replacepkgs",
					"--replacefiles",
					"--nodeps",
					installerPath
				]);
			}
			throw new Error(`Package manager ${packageManager} not supported`);
		}
	};
}));
//#endregion
//#region node_modules/electron-updater/out/MacUpdater.js
var require_MacUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MacUpdater = void 0;
	var builder_util_runtime_1 = require_out();
	var fs_extra_1 = require_lib();
	var fs_1 = __require("fs");
	var path$4 = __require("path");
	var http_1 = __require("http");
	var AppUpdater_1 = require_AppUpdater();
	var Provider_1 = require_Provider();
	var child_process_1$1 = __require("child_process");
	var crypto_1 = __require("crypto");
	exports.MacUpdater = class MacUpdater extends AppUpdater_1.AppUpdater {
		constructor(options, app) {
			super(options, app);
			this.nativeUpdater = __require("electron").autoUpdater;
			this.squirrelDownloadedUpdate = false;
			this.nativeUpdater.on("error", (it) => {
				this._logger.warn(it);
				this.emit("error", it);
			});
			this.nativeUpdater.on("update-downloaded", () => {
				this.squirrelDownloadedUpdate = true;
				this.debug("nativeUpdater.update-downloaded");
			});
		}
		/** Filters update files to the appropriate architecture.
		* On arm64 Macs (including Rosetta), arm64 files are preferred when available.
		* On x64 Macs, arm64 files are excluded. */
		static filterFilesForArch(files, isArm64Mac) {
			const isArm64File = (file) => {
				var _a;
				return file.url.pathname.includes("arm64") || ((_a = file.info.url) === null || _a === void 0 ? void 0 : _a.includes("arm64"));
			};
			if (isArm64Mac && files.some(isArm64File)) return files.filter((file) => isArm64Mac === isArm64File(file));
			return files.filter((file) => !isArm64File(file));
		}
		debug(message) {
			if (this._logger.debug != null) this._logger.debug(message);
		}
		closeServerIfExists() {
			if (this.server) {
				this.debug("Closing proxy server");
				this.server.close((err) => {
					if (err) this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
				});
			}
		}
		async doDownloadUpdate(downloadUpdateOptions) {
			let files = downloadUpdateOptions.updateInfoAndProvider.provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info);
			const log = this._logger;
			const sysctlRosettaInfoKey = "sysctl.proc_translated";
			let isRosetta = false;
			try {
				this.debug("Checking for macOS Rosetta environment");
				isRosetta = (0, child_process_1$1.execFileSync)("sysctl", [sysctlRosettaInfoKey], { encoding: "utf8" }).includes(`${sysctlRosettaInfoKey}: 1`);
				log.info(`Checked for macOS Rosetta environment (isRosetta=${isRosetta})`);
			} catch (e) {
				log.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${e}`);
			}
			let isArm64Mac = false;
			try {
				this.debug("Checking for arm64 in uname");
				const isArm = (0, child_process_1$1.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
				log.info(`Checked 'uname -a': arm64=${isArm}`);
				isArm64Mac = isArm64Mac || isArm;
			} catch (e) {
				log.warn(`uname shell command to check for arm64 failed: ${e}`);
			}
			isArm64Mac = isArm64Mac || process.arch === "arm64" || isRosetta;
			files = MacUpdater.filterFilesForArch(files, isArm64Mac);
			const zipFileInfo = (0, Provider_1.findFile)(files, "zip", ["pkg", "dmg"]);
			if (zipFileInfo == null) throw (0, builder_util_runtime_1.newError)(`ZIP file not provided: ${(0, builder_util_runtime_1.safeStringifyJson)(files)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
			const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
			const CURRENT_MAC_APP_ZIP_FILE_NAME = "update.zip";
			return this.executeDownload({
				fileExtension: "zip",
				fileInfo: zipFileInfo,
				downloadUpdateOptions,
				task: async (destinationFile, downloadOptions) => {
					const cachedUpdateFilePath = path$4.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
					const canDifferentialDownload = () => {
						if (!(0, fs_extra_1.pathExistsSync)(cachedUpdateFilePath)) {
							log.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download");
							return false;
						}
						return !downloadUpdateOptions.disableDifferentialDownload;
					};
					let differentialDownloadFailed = true;
					if (canDifferentialDownload()) differentialDownloadFailed = await this.differentialDownloadInstaller(zipFileInfo, downloadUpdateOptions, destinationFile, provider, CURRENT_MAC_APP_ZIP_FILE_NAME);
					if (differentialDownloadFailed) await this.httpExecutor.download(zipFileInfo.url, destinationFile, downloadOptions);
				},
				done: async (event) => {
					if (!downloadUpdateOptions.disableDifferentialDownload) try {
						const cachedUpdateFilePath = path$4.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
						await (0, fs_extra_1.copyFile)(event.downloadedFile, cachedUpdateFilePath);
					} catch (error) {
						this._logger.warn(`Unable to copy file for caching for future differential downloads: ${error.message}`);
					}
					return this.updateDownloaded(zipFileInfo, event);
				}
			});
		}
		async updateDownloaded(zipFileInfo, event) {
			var _a;
			const downloadedFile = event.downloadedFile;
			const updateFileSize = (_a = zipFileInfo.info.size) !== null && _a !== void 0 ? _a : (await (0, fs_extra_1.stat)(downloadedFile)).size;
			const log = this._logger;
			const logContext = `fileToProxy=${zipFileInfo.url.href}`;
			this.closeServerIfExists();
			this.debug(`Creating proxy server for native Squirrel.Mac (${logContext})`);
			this.server = (0, http_1.createServer)();
			this.debug(`Proxy server for native Squirrel.Mac is created (${logContext})`);
			this.server.on("close", () => {
				log.info(`Proxy server for native Squirrel.Mac is closed (${logContext})`);
			});
			const getServerUrl = (s) => {
				const address = s.address();
				if (typeof address === "string") return address;
				return `http://127.0.0.1:${address === null || address === void 0 ? void 0 : address.port}`;
			};
			return await new Promise((resolve, reject) => {
				const pass = (0, crypto_1.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
				const authInfo = Buffer.from(`autoupdater:${pass}`, "ascii");
				const fileUrl = `/${(0, crypto_1.randomBytes)(64).toString("hex")}.zip`;
				this.server.on("request", (request, response) => {
					const requestUrl = request.url;
					log.info(`${requestUrl} requested`);
					if (requestUrl === "/") {
						if (!request.headers.authorization || request.headers.authorization.indexOf("Basic ") === -1) {
							response.statusCode = 401;
							response.statusMessage = "Invalid Authentication Credentials";
							response.end();
							log.warn("No authenthication info");
							return;
						}
						const base64Credentials = request.headers.authorization.split(" ")[1];
						const [username, password] = Buffer.from(base64Credentials, "base64").toString("ascii").split(":");
						if (username !== "autoupdater" || password !== pass) {
							response.statusCode = 401;
							response.statusMessage = "Invalid Authentication Credentials";
							response.end();
							log.warn("Invalid authenthication credentials");
							return;
						}
						const data = Buffer.from(`{ "url": "${getServerUrl(this.server)}${fileUrl}" }`);
						response.writeHead(200, {
							"Content-Type": "application/json",
							"Content-Length": data.length
						});
						response.end(data);
						return;
					}
					if (!requestUrl.startsWith(fileUrl)) {
						log.warn(`${requestUrl} requested, but not supported`);
						response.writeHead(404);
						response.end();
						return;
					}
					log.info(`${fileUrl} requested by Squirrel.Mac, pipe ${downloadedFile}`);
					let errorOccurred = false;
					response.on("finish", () => {
						if (!errorOccurred) {
							this.nativeUpdater.removeListener("error", reject);
							resolve([]);
						}
					});
					const readStream = (0, fs_1.createReadStream)(downloadedFile);
					readStream.on("error", (error) => {
						try {
							response.end();
						} catch (e) {
							log.warn(`cannot end response: ${e}`);
						}
						errorOccurred = true;
						this.nativeUpdater.removeListener("error", reject);
						reject(/* @__PURE__ */ new Error(`Cannot pipe "${downloadedFile}": ${error}`));
					});
					response.writeHead(200, {
						"Content-Type": "application/zip",
						"Content-Length": updateFileSize
					});
					readStream.pipe(response);
				});
				this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${logContext})`);
				this.server.listen(0, "127.0.0.1", () => {
					this.debug(`Proxy server for native Squirrel.Mac is listening (address=${getServerUrl(this.server)}, ${logContext})`);
					this.nativeUpdater.setFeedURL({
						url: getServerUrl(this.server),
						headers: {
							"Cache-Control": "no-cache",
							Authorization: `Basic ${authInfo.toString("base64")}`
						}
					});
					this.dispatchUpdateDownloaded(event);
					if (this.autoInstallOnAppQuit) {
						this.nativeUpdater.once("error", reject);
						this.nativeUpdater.checkForUpdates();
					} else resolve([]);
				});
			});
		}
		handleUpdateDownloaded() {
			if (this.autoRunAppAfterInstall) this.nativeUpdater.quitAndInstall();
			else this.app.quit();
			this.closeServerIfExists();
		}
		quitAndInstall() {
			if (this.squirrelDownloadedUpdate) this.handleUpdateDownloaded();
			else {
				this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded());
				if (!this.autoInstallOnAppQuit)
 /**
				* If this was not `true` previously then MacUpdater.doDownloadUpdate()
				* would not actually initiate the downloading by electron's autoUpdater
				*/
				this.nativeUpdater.checkForUpdates();
			}
		}
	};
}));
//#endregion
//#region node_modules/electron-updater/out/windowsExecutableCodeSignatureVerifier.js
var require_windowsExecutableCodeSignatureVerifier = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.verifySignature = verifySignature;
	var builder_util_runtime_1 = require_out();
	var child_process_1 = __require("child_process");
	var os = __require("os");
	var path$3 = __require("path");
	function preparePowerShellExec(command, timeout) {
		return [
			`set "PSModulePath=" & chcp 65001 >NUL & powershell.exe`,
			[
				"-NoProfile",
				"-NonInteractive",
				"-InputFormat",
				"None",
				"-Command",
				command
			],
			{
				shell: true,
				timeout
			}
		];
	}
	function verifySignature(publisherNames, unescapedTempUpdateFile, logger) {
		return new Promise((resolve, reject) => {
			const tempUpdateFile = unescapedTempUpdateFile.replace(/'/g, "''");
			logger.info(`Verifying signature ${tempUpdateFile}`);
			(0, child_process_1.execFile)(...preparePowerShellExec(`"Get-AuthenticodeSignature -LiteralPath '${tempUpdateFile}' | ConvertTo-Json -Compress"`, 2e4), (error, stdout, stderr) => {
				var _a;
				try {
					if (error != null || stderr) {
						handleError(logger, error, stderr, reject);
						resolve(null);
						return;
					}
					const data = parseOut(stdout);
					if (data.Status === 0) {
						try {
							const normlaizedUpdateFilePath = path$3.normalize(data.Path);
							const normalizedTempUpdateFile = path$3.normalize(unescapedTempUpdateFile);
							logger.info(`LiteralPath: ${normlaizedUpdateFilePath}. Update Path: ${normalizedTempUpdateFile}`);
							if (normlaizedUpdateFilePath !== normalizedTempUpdateFile) {
								handleError(logger, /* @__PURE__ */ new Error(`LiteralPath of ${normlaizedUpdateFilePath} is different than ${normalizedTempUpdateFile}`), stderr, reject);
								resolve(null);
								return;
							}
						} catch (error) {
							logger.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(_a = error.message) !== null && _a !== void 0 ? _a : error.stack}`);
						}
						const subject = (0, builder_util_runtime_1.parseDn)(data.SignerCertificate.Subject);
						let match = false;
						for (const name of publisherNames) {
							const dn = (0, builder_util_runtime_1.parseDn)(name);
							if (dn.size) match = Array.from(dn.keys()).every((key) => {
								return dn.get(key) === subject.get(key);
							});
							else if (name === subject.get("CN")) {
								logger.warn(`Signature validated using only CN ${name}. Please add your full Distinguished Name (DN) to publisherNames configuration`);
								match = true;
							}
							if (match) {
								resolve(null);
								return;
							}
						}
					}
					const result = `publisherNames: ${publisherNames.join(" | ")}, raw info: ` + JSON.stringify(data, (name, value) => name === "RawData" ? void 0 : value, 2);
					logger.warn(`Sign verification failed, installer signed with incorrect certificate: ${result}`);
					resolve(result);
				} catch (e) {
					handleError(logger, e, null, reject);
					resolve(null);
					return;
				}
			});
		});
	}
	function parseOut(out) {
		const data = JSON.parse(out);
		delete data.PrivateKey;
		delete data.IsOSBinary;
		delete data.SignatureType;
		const signerCertificate = data.SignerCertificate;
		if (signerCertificate != null) {
			delete signerCertificate.Archived;
			delete signerCertificate.Extensions;
			delete signerCertificate.Handle;
			delete signerCertificate.HasPrivateKey;
			delete signerCertificate.SubjectName;
		}
		return data;
	}
	function handleError(logger, error, stderr, reject) {
		if (isOldWin6()) {
			logger.warn(`Cannot execute Get-AuthenticodeSignature: ${error || stderr}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
			return;
		}
		try {
			(0, child_process_1.execFileSync)(...preparePowerShellExec("ConvertTo-Json test", 1e4));
		} catch (testError) {
			logger.warn(`Cannot execute ConvertTo-Json: ${testError.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
			return;
		}
		if (error != null) reject(error);
		if (stderr) reject(/* @__PURE__ */ new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${stderr}. Failing signature validation due to unknown stderr.`));
	}
	function isOldWin6() {
		const winVersion = os.release();
		return winVersion.startsWith("6.") && !winVersion.startsWith("6.3");
	}
}));
//#endregion
//#region node_modules/electron-updater/out/NsisUpdater.js
var require_NsisUpdater = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NsisUpdater = void 0;
	var builder_util_runtime_1 = require_out();
	var path$2 = __require("path");
	var BaseUpdater_1 = require_BaseUpdater();
	var FileWithEmbeddedBlockMapDifferentialDownloader_1 = require_FileWithEmbeddedBlockMapDifferentialDownloader();
	var types_1 = require_types();
	var Provider_1 = require_Provider();
	var fs_extra_1 = require_lib();
	var windowsExecutableCodeSignatureVerifier_1 = require_windowsExecutableCodeSignatureVerifier();
	var url_1 = __require("url");
	var NsisUpdater = class extends BaseUpdater_1.BaseUpdater {
		constructor(options, app) {
			super(options, app);
			this._verifyUpdateCodeSignature = (publisherNames, unescapedTempUpdateFile) => (0, windowsExecutableCodeSignatureVerifier_1.verifySignature)(publisherNames, unescapedTempUpdateFile, this._logger);
		}
		/**
		* The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
		* The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
		*/
		get verifyUpdateCodeSignature() {
			return this._verifyUpdateCodeSignature;
		}
		set verifyUpdateCodeSignature(value) {
			if (value) this._verifyUpdateCodeSignature = value;
		}
		/*** @private */
		doDownloadUpdate(downloadUpdateOptions) {
			const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
			const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "exe");
			return this.executeDownload({
				fileExtension: "exe",
				downloadUpdateOptions,
				fileInfo,
				task: async (destinationFile, downloadOptions, packageFile, removeTempDirIfAny) => {
					const packageInfo = fileInfo.packageInfo;
					const isWebInstaller = packageInfo != null && packageFile != null;
					if (isWebInstaller && downloadUpdateOptions.disableWebInstaller) throw (0, builder_util_runtime_1.newError)(`Unable to download new version ${downloadUpdateOptions.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
					if (!isWebInstaller && !downloadUpdateOptions.disableWebInstaller) this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version.");
					if (isWebInstaller || downloadUpdateOptions.disableDifferentialDownload || await this.differentialDownloadInstaller(fileInfo, downloadUpdateOptions, destinationFile, provider, builder_util_runtime_1.CURRENT_APP_INSTALLER_FILE_NAME)) await this.httpExecutor.download(fileInfo.url, destinationFile, downloadOptions);
					const signatureVerificationStatus = await this.verifySignature(destinationFile);
					if (signatureVerificationStatus != null) {
						await removeTempDirIfAny();
						throw (0, builder_util_runtime_1.newError)(`New version ${downloadUpdateOptions.updateInfoAndProvider.info.version} is not signed by the application owner: ${signatureVerificationStatus}`, "ERR_UPDATER_INVALID_SIGNATURE");
					}
					if (isWebInstaller) {
						if (await this.differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packageFile, provider)) try {
							await this.httpExecutor.download(new url_1.URL(packageInfo.path), packageFile, {
								headers: downloadUpdateOptions.requestHeaders,
								cancellationToken: downloadUpdateOptions.cancellationToken,
								sha512: packageInfo.sha512
							});
						} catch (e) {
							try {
								await (0, fs_extra_1.unlink)(packageFile);
							} catch (_ignored) {}
							throw e;
						}
					}
				}
			});
		}
		async verifySignature(tempUpdateFile) {
			let publisherName;
			try {
				publisherName = (await this.configOnDisk.value).publisherName;
				if (publisherName == null) return null;
			} catch (e) {
				if (e.code === "ENOENT") return null;
				throw e;
			}
			return await this._verifyUpdateCodeSignature(Array.isArray(publisherName) ? publisherName : [publisherName], tempUpdateFile);
		}
		doInstall(options) {
			const installerPath = this.installerPath;
			if (installerPath == null) {
				this.dispatchError(/* @__PURE__ */ new Error("No update filepath provided, can't quit and install"));
				return false;
			}
			const args = ["--updated"];
			if (options.isSilent) args.push("/S");
			if (options.isForceRunAfter) args.push("--force-run");
			if (this.installDirectory) args.push(`/D=${this.installDirectory}`);
			const packagePath = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
			if (packagePath != null) args.push(`--package-file=${packagePath}`);
			const callUsingElevation = () => {
				this.spawnLog(path$2.join(process.resourcesPath, "elevate.exe"), [installerPath].concat(args)).catch((e) => this.dispatchError(e));
			};
			if (options.isAdminRightsRequired) {
				this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe");
				callUsingElevation();
				return true;
			}
			this.spawnLog(installerPath, args).catch((e) => {
				const errorCode = e.code;
				this._logger.info(`Cannot run installer: error code: ${errorCode}, error message: "${e.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`);
				if (errorCode === "UNKNOWN" || errorCode === "EACCES") callUsingElevation();
				else if (errorCode === "ENOENT") __require("electron").shell.openPath(installerPath).catch((err) => this.dispatchError(err));
				else this.dispatchError(e);
			});
			return true;
		}
		async differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packagePath, provider) {
			if (packageInfo.blockMapSize == null) return true;
			try {
				const downloadOptions = {
					newUrl: new url_1.URL(packageInfo.path),
					oldFile: path$2.join(this.downloadedUpdateHelper.cacheDir, builder_util_runtime_1.CURRENT_APP_PACKAGE_FILE_NAME),
					logger: this._logger,
					newFile: packagePath,
					requestHeaders: this.requestHeaders,
					isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
					cancellationToken: downloadUpdateOptions.cancellationToken
				};
				if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
				await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(packageInfo, this.httpExecutor, downloadOptions).download();
			} catch (e) {
				this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
				return process.platform === "win32";
			}
			return false;
		}
	};
	exports.NsisUpdater = NsisUpdater;
}));
//#endregion
//#region node_modules/slice-ansi/node_modules/is-fullwidth-code-point/index.js
var import_main = (/* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NsisUpdater = exports.MacUpdater = exports.RpmUpdater = exports.PacmanUpdater = exports.DebUpdater = exports.AppImageUpdater = exports.Provider = exports.NoOpLogger = exports.AppUpdater = exports.BaseUpdater = void 0;
	var fs_extra_1 = require_lib();
	var path$1 = __require("path");
	var BaseUpdater_1 = require_BaseUpdater();
	Object.defineProperty(exports, "BaseUpdater", {
		enumerable: true,
		get: function() {
			return BaseUpdater_1.BaseUpdater;
		}
	});
	var AppUpdater_1 = require_AppUpdater();
	Object.defineProperty(exports, "AppUpdater", {
		enumerable: true,
		get: function() {
			return AppUpdater_1.AppUpdater;
		}
	});
	Object.defineProperty(exports, "NoOpLogger", {
		enumerable: true,
		get: function() {
			return AppUpdater_1.NoOpLogger;
		}
	});
	var Provider_1 = require_Provider();
	Object.defineProperty(exports, "Provider", {
		enumerable: true,
		get: function() {
			return Provider_1.Provider;
		}
	});
	var AppImageUpdater_1 = require_AppImageUpdater();
	Object.defineProperty(exports, "AppImageUpdater", {
		enumerable: true,
		get: function() {
			return AppImageUpdater_1.AppImageUpdater;
		}
	});
	var DebUpdater_1 = require_DebUpdater();
	Object.defineProperty(exports, "DebUpdater", {
		enumerable: true,
		get: function() {
			return DebUpdater_1.DebUpdater;
		}
	});
	var PacmanUpdater_1 = require_PacmanUpdater();
	Object.defineProperty(exports, "PacmanUpdater", {
		enumerable: true,
		get: function() {
			return PacmanUpdater_1.PacmanUpdater;
		}
	});
	var RpmUpdater_1 = require_RpmUpdater();
	Object.defineProperty(exports, "RpmUpdater", {
		enumerable: true,
		get: function() {
			return RpmUpdater_1.RpmUpdater;
		}
	});
	var MacUpdater_1 = require_MacUpdater();
	Object.defineProperty(exports, "MacUpdater", {
		enumerable: true,
		get: function() {
			return MacUpdater_1.MacUpdater;
		}
	});
	var NsisUpdater_1 = require_NsisUpdater();
	Object.defineProperty(exports, "NsisUpdater", {
		enumerable: true,
		get: function() {
			return NsisUpdater_1.NsisUpdater;
		}
	});
	__exportStar(require_types(), exports);
	var _autoUpdater;
	function doLoadAutoUpdater() {
		if (process.platform === "win32") _autoUpdater = new (require_NsisUpdater()).NsisUpdater();
		else if (process.platform === "darwin") _autoUpdater = new (require_MacUpdater()).MacUpdater();
		else {
			_autoUpdater = new (require_AppImageUpdater()).AppImageUpdater();
			try {
				const identity = path$1.join(process.resourcesPath, "package-type");
				if (!(0, fs_extra_1.existsSync)(identity)) return _autoUpdater;
				switch ((0, fs_extra_1.readFileSync)(identity).toString().trim()) {
					case "deb":
						_autoUpdater = new (require_DebUpdater()).DebUpdater();
						break;
					case "rpm":
						_autoUpdater = new (require_RpmUpdater()).RpmUpdater();
						break;
					case "pacman": _autoUpdater = new (require_PacmanUpdater()).PacmanUpdater();
				}
			} catch (error) {
				console.warn("Unable to detect 'package-type' for autoUpdater (rpm/deb/pacman support). If you'd like to expand support, please consider contributing to electron-builder", error.message);
			}
		}
		return _autoUpdater;
	}
	Object.defineProperty(exports, "autoUpdater", {
		enumerable: true,
		get: () => {
			return _autoUpdater || doLoadAutoUpdater();
		}
	});
})))();
function isFullwidthCodePoint(codePoint) {
	if (!Number.isInteger(codePoint)) return false;
	return codePoint >= 4352 && (codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || 11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || 12880 <= codePoint && codePoint <= 19903 || 19968 <= codePoint && codePoint <= 42182 || 43360 <= codePoint && codePoint <= 43388 || 44032 <= codePoint && codePoint <= 55203 || 63744 <= codePoint && codePoint <= 64255 || 65040 <= codePoint && codePoint <= 65049 || 65072 <= codePoint && codePoint <= 65131 || 65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || 110592 <= codePoint && codePoint <= 110593 || 127488 <= codePoint && codePoint <= 127569 || 131072 <= codePoint && codePoint <= 262141);
}
//#endregion
//#region node_modules/slice-ansi/node_modules/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\u001B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\u001B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
	modifier: {
		reset: [0, 0],
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		overline: [53, 55],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29]
	},
	color: {
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		blackBright: [90, 39],
		gray: [90, 39],
		grey: [90, 39],
		redBright: [91, 39],
		greenBright: [92, 39],
		yellowBright: [93, 39],
		blueBright: [94, 39],
		magentaBright: [95, 39],
		cyanBright: [96, 39],
		whiteBright: [97, 39]
	},
	bgColor: {
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],
		bgBlackBright: [100, 49],
		bgGray: [100, 49],
		bgGrey: [100, 49],
		bgRedBright: [101, 49],
		bgGreenBright: [102, 49],
		bgYellowBright: [103, 49],
		bgBlueBright: [104, 49],
		bgMagentaBright: [105, 49],
		bgCyanBright: [106, 49],
		bgWhiteBright: [107, 49]
	}
};
Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
[...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
	const codes = /* @__PURE__ */ new Map();
	for (const [groupName, group] of Object.entries(styles)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};
			group[styleName] = styles[styleName];
			codes.set(style[0], style[1]);
		}
		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	}
	Object.defineProperty(styles, "codes", {
		value: codes,
		enumerable: false
	});
	styles.color.close = "\x1B[39m";
	styles.bgColor.close = "\x1B[49m";
	styles.color.ansi = wrapAnsi16();
	styles.color.ansi256 = wrapAnsi256();
	styles.color.ansi16m = wrapAnsi16m();
	styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
	styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
	styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
	Object.defineProperties(styles, {
		rgbToAnsi256: {
			value(red, green, blue) {
				if (red === green && green === blue) {
					if (red < 8) return 16;
					if (red > 248) return 231;
					return Math.round((red - 8) / 247 * 24) + 232;
				}
				return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
			},
			enumerable: false
		},
		hexToRgb: {
			value(hex) {
				const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
				if (!matches) return [
					0,
					0,
					0
				];
				let [colorString] = matches;
				if (colorString.length === 3) colorString = [...colorString].map((character) => character + character).join("");
				const integer = Number.parseInt(colorString, 16);
				return [
					integer >> 16 & 255,
					integer >> 8 & 255,
					integer & 255
				];
			},
			enumerable: false
		},
		hexToAnsi256: {
			value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
			enumerable: false
		},
		ansi256ToAnsi: {
			value(code) {
				if (code < 8) return 30 + code;
				if (code < 16) return 90 + (code - 8);
				let red;
				let green;
				let blue;
				if (code >= 232) {
					red = ((code - 232) * 10 + 8) / 255;
					green = red;
					blue = red;
				} else {
					code -= 16;
					const remainder = code % 36;
					red = Math.floor(code / 36) / 5;
					green = Math.floor(remainder / 6) / 5;
					blue = remainder % 6 / 5;
				}
				const value = Math.max(red, green, blue) * 2;
				if (value === 0) return 30;
				let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
				if (value === 2) result += 60;
				return result;
			},
			enumerable: false
		},
		rgbToAnsi: {
			value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
			enumerable: false
		},
		hexToAnsi: {
			value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
			enumerable: false
		}
	});
	return styles;
}
var ansiStyles = assembleStyles();
//#endregion
//#region node_modules/slice-ansi/index.js
var astralRegex = /^[\uD800-\uDBFF][\uDC00-\uDFFF]$/;
var ESCAPES = ["\x1B", ""];
var wrapAnsi = (code) => `${ESCAPES[0]}[${code}m`;
var checkAnsi = (ansiCodes, isEscapes, endAnsiCode) => {
	let output = [];
	ansiCodes = [...ansiCodes];
	for (let ansiCode of ansiCodes) {
		const ansiCodeOrigin = ansiCode;
		if (ansiCode.includes(";")) ansiCode = ansiCode.split(";")[0][0] + "0";
		const item = ansiStyles.codes.get(Number.parseInt(ansiCode, 10));
		if (item) {
			const indexEscape = ansiCodes.indexOf(item.toString());
			if (indexEscape === -1) output.push(wrapAnsi(isEscapes ? item : ansiCodeOrigin));
			else ansiCodes.splice(indexEscape, 1);
		} else if (isEscapes) {
			output.push(wrapAnsi(0));
			break;
		} else output.push(wrapAnsi(ansiCodeOrigin));
	}
	if (isEscapes) {
		output = output.filter((element, index) => output.indexOf(element) === index);
		if (endAnsiCode !== void 0) {
			const fistEscapeCode = wrapAnsi(ansiStyles.codes.get(Number.parseInt(endAnsiCode, 10)));
			output = output.reduce((current, next) => next === fistEscapeCode ? [next, ...current] : [...current, next], []);
		}
	}
	return output.join("");
};
function sliceAnsi(string, begin, end) {
	const characters = [...string];
	const ansiCodes = [];
	let stringEnd = typeof end === "number" ? end : characters.length;
	let isInsideEscape = false;
	let ansiCode;
	let visible = 0;
	let output = "";
	for (const [index, character] of characters.entries()) {
		let leftEscape = false;
		if (ESCAPES.includes(character)) {
			const code = /\d[^m]*/.exec(string.slice(index, index + 18));
			ansiCode = code && code.length > 0 ? code[0] : void 0;
			if (visible < stringEnd) {
				isInsideEscape = true;
				if (ansiCode !== void 0) ansiCodes.push(ansiCode);
			}
		} else if (isInsideEscape && character === "m") {
			isInsideEscape = false;
			leftEscape = true;
		}
		if (!isInsideEscape && !leftEscape) visible++;
		if (!astralRegex.test(character) && isFullwidthCodePoint(character.codePointAt())) {
			visible++;
			if (typeof end !== "number") stringEnd++;
		}
		if (visible > begin && visible <= stringEnd) output += character;
		else if (visible === begin && !isInsideEscape && ansiCode !== void 0) output = checkAnsi(ansiCodes);
		else if (visible >= stringEnd) {
			output += checkAnsi(ansiCodes, true, ansiCode);
			break;
		}
	}
	return output;
}
//#endregion
//#region node_modules/cli-truncate/node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
	return new RegExp(`(?:\\u001B\\][^\\u0007\\u001B\\u009C]*(?:\\u0007|\\u001B\\u005C|\\u009C))|[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]`, onlyFirst ? void 0 : "g");
}
//#endregion
//#region node_modules/cli-truncate/node_modules/strip-ansi/index.js
var regex = ansiRegex();
function stripAnsi(string) {
	if (typeof string !== "string") throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
	if (!string.includes("\x1B") && !string.includes("")) return string;
	return string.replace(regex, "");
}
var ambiguousRanges = [
	161,
	161,
	164,
	164,
	167,
	168,
	170,
	170,
	173,
	174,
	176,
	180,
	182,
	186,
	188,
	191,
	198,
	198,
	208,
	208,
	215,
	216,
	222,
	225,
	230,
	230,
	232,
	234,
	236,
	237,
	240,
	240,
	242,
	243,
	247,
	250,
	252,
	252,
	254,
	254,
	257,
	257,
	273,
	273,
	275,
	275,
	283,
	283,
	294,
	295,
	299,
	299,
	305,
	307,
	312,
	312,
	319,
	322,
	324,
	324,
	328,
	331,
	333,
	333,
	338,
	339,
	358,
	359,
	363,
	363,
	462,
	462,
	464,
	464,
	466,
	466,
	468,
	468,
	470,
	470,
	472,
	472,
	474,
	474,
	476,
	476,
	593,
	593,
	609,
	609,
	708,
	708,
	711,
	711,
	713,
	715,
	717,
	717,
	720,
	720,
	728,
	731,
	733,
	733,
	735,
	735,
	768,
	879,
	913,
	929,
	931,
	937,
	945,
	961,
	963,
	969,
	1025,
	1025,
	1040,
	1103,
	1105,
	1105,
	8208,
	8208,
	8211,
	8214,
	8216,
	8217,
	8220,
	8221,
	8224,
	8226,
	8228,
	8231,
	8240,
	8240,
	8242,
	8243,
	8245,
	8245,
	8251,
	8251,
	8254,
	8254,
	8308,
	8308,
	8319,
	8319,
	8321,
	8324,
	8364,
	8364,
	8451,
	8451,
	8453,
	8453,
	8457,
	8457,
	8467,
	8467,
	8470,
	8470,
	8481,
	8482,
	8486,
	8486,
	8491,
	8491,
	8531,
	8532,
	8539,
	8542,
	8544,
	8555,
	8560,
	8569,
	8585,
	8585,
	8592,
	8601,
	8632,
	8633,
	8658,
	8658,
	8660,
	8660,
	8679,
	8679,
	8704,
	8704,
	8706,
	8707,
	8711,
	8712,
	8715,
	8715,
	8719,
	8719,
	8721,
	8721,
	8725,
	8725,
	8730,
	8730,
	8733,
	8736,
	8739,
	8739,
	8741,
	8741,
	8743,
	8748,
	8750,
	8750,
	8756,
	8759,
	8764,
	8765,
	8776,
	8776,
	8780,
	8780,
	8786,
	8786,
	8800,
	8801,
	8804,
	8807,
	8810,
	8811,
	8814,
	8815,
	8834,
	8835,
	8838,
	8839,
	8853,
	8853,
	8857,
	8857,
	8869,
	8869,
	8895,
	8895,
	8978,
	8978,
	9312,
	9449,
	9451,
	9547,
	9552,
	9587,
	9600,
	9615,
	9618,
	9621,
	9632,
	9633,
	9635,
	9641,
	9650,
	9651,
	9654,
	9655,
	9660,
	9661,
	9664,
	9665,
	9670,
	9672,
	9675,
	9675,
	9678,
	9681,
	9698,
	9701,
	9711,
	9711,
	9733,
	9734,
	9737,
	9737,
	9742,
	9743,
	9756,
	9756,
	9758,
	9758,
	9792,
	9792,
	9794,
	9794,
	9824,
	9825,
	9827,
	9829,
	9831,
	9834,
	9836,
	9837,
	9839,
	9839,
	9886,
	9887,
	9919,
	9919,
	9926,
	9933,
	9935,
	9939,
	9941,
	9953,
	9955,
	9955,
	9960,
	9961,
	9963,
	9969,
	9972,
	9972,
	9974,
	9977,
	9979,
	9980,
	9982,
	9983,
	10045,
	10045,
	10102,
	10111,
	11094,
	11097,
	12872,
	12879,
	57344,
	63743,
	65024,
	65039,
	65533,
	65533,
	127232,
	127242,
	127248,
	127277,
	127280,
	127337,
	127344,
	127373,
	127375,
	127376,
	127387,
	127404,
	917760,
	917999,
	983040,
	1048573,
	1048576,
	1114109
];
var fullwidthRanges = [
	12288,
	12288,
	65281,
	65376,
	65504,
	65510
];
var wideRanges = [
	4352,
	4447,
	8986,
	8987,
	9001,
	9002,
	9193,
	9196,
	9200,
	9200,
	9203,
	9203,
	9725,
	9726,
	9748,
	9749,
	9776,
	9783,
	9800,
	9811,
	9855,
	9855,
	9866,
	9871,
	9875,
	9875,
	9889,
	9889,
	9898,
	9899,
	9917,
	9918,
	9924,
	9925,
	9934,
	9934,
	9940,
	9940,
	9962,
	9962,
	9970,
	9971,
	9973,
	9973,
	9978,
	9978,
	9981,
	9981,
	9989,
	9989,
	9994,
	9995,
	10024,
	10024,
	10060,
	10060,
	10062,
	10062,
	10067,
	10069,
	10071,
	10071,
	10133,
	10135,
	10160,
	10160,
	10175,
	10175,
	11035,
	11036,
	11088,
	11088,
	11093,
	11093,
	11904,
	11929,
	11931,
	12019,
	12032,
	12245,
	12272,
	12287,
	12289,
	12350,
	12353,
	12438,
	12441,
	12543,
	12549,
	12591,
	12593,
	12686,
	12688,
	12773,
	12783,
	12830,
	12832,
	12871,
	12880,
	42124,
	42128,
	42182,
	43360,
	43388,
	44032,
	55203,
	63744,
	64255,
	65040,
	65049,
	65072,
	65106,
	65108,
	65126,
	65128,
	65131,
	94176,
	94180,
	94192,
	94198,
	94208,
	101589,
	101631,
	101662,
	101760,
	101874,
	110576,
	110579,
	110581,
	110587,
	110589,
	110590,
	110592,
	110882,
	110898,
	110898,
	110928,
	110930,
	110933,
	110933,
	110948,
	110951,
	110960,
	111355,
	119552,
	119638,
	119648,
	119670,
	126980,
	126980,
	127183,
	127183,
	127374,
	127374,
	127377,
	127386,
	127488,
	127490,
	127504,
	127547,
	127552,
	127560,
	127568,
	127569,
	127584,
	127589,
	127744,
	127776,
	127789,
	127797,
	127799,
	127868,
	127870,
	127891,
	127904,
	127946,
	127951,
	127955,
	127968,
	127984,
	127988,
	127988,
	127992,
	128062,
	128064,
	128064,
	128066,
	128252,
	128255,
	128317,
	128331,
	128334,
	128336,
	128359,
	128378,
	128378,
	128405,
	128406,
	128420,
	128420,
	128507,
	128591,
	128640,
	128709,
	128716,
	128716,
	128720,
	128722,
	128725,
	128728,
	128732,
	128735,
	128747,
	128748,
	128756,
	128764,
	128992,
	129003,
	129008,
	129008,
	129292,
	129338,
	129340,
	129349,
	129351,
	129535,
	129648,
	129660,
	129664,
	129674,
	129678,
	129734,
	129736,
	129736,
	129741,
	129756,
	129759,
	129770,
	129775,
	129784,
	131072,
	196605,
	196608,
	262141
];
//#endregion
//#region node_modules/get-east-asian-width/utilities.js
/**
Binary search on a sorted flat array of [start, end] pairs.

@param {number[]} ranges - Flat array of inclusive [start, end] range pairs, e.g. [0, 5, 10, 20].
@param {number} codePoint - The value to search for.
@returns {boolean} Whether the value falls within any of the ranges.
*/
var isInRange = (ranges, codePoint) => {
	let low = 0;
	let high = Math.floor(ranges.length / 2) - 1;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const i = mid * 2;
		if (codePoint < ranges[i]) high = mid - 1;
		else if (codePoint > ranges[i + 1]) low = mid + 1;
		else return true;
	}
	return false;
};
//#endregion
//#region node_modules/get-east-asian-width/lookup.js
var commonCjkCodePoint = 19968;
var [wideFastPathStart, wideFastPathEnd] = /* #__PURE__ */ findWideFastPathRange(wideRanges);
function findWideFastPathRange(ranges) {
	let fastPathStart = ranges[0];
	let fastPathEnd = ranges[1];
	for (let index = 0; index < ranges.length; index += 2) {
		const start = ranges[index];
		const end = ranges[index + 1];
		if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) return [start, end];
		if (end - start > fastPathEnd - fastPathStart) {
			fastPathStart = start;
			fastPathEnd = end;
		}
	}
	return [fastPathStart, fastPathEnd];
}
var isAmbiguous = (codePoint) => {
	if (codePoint < 161 || codePoint > 1114109) return false;
	return isInRange(ambiguousRanges, codePoint);
};
var isFullWidth = (codePoint) => {
	if (codePoint < 12288 || codePoint > 65510) return false;
	return isInRange(fullwidthRanges, codePoint);
};
var isWide = (codePoint) => {
	if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) return true;
	if (codePoint < 4352 || codePoint > 262141) return false;
	return isInRange(wideRanges, codePoint);
};
//#endregion
//#region node_modules/get-east-asian-width/index.js
function validate(codePoint) {
	if (!Number.isSafeInteger(codePoint)) throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
	validate(codePoint);
	if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) return 2;
	return 1;
}
//#endregion
//#region node_modules/cli-truncate/node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
	return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
//#endregion
//#region node_modules/cli-truncate/node_modules/string-width/index.js
var segmenter = new Intl.Segmenter();
var defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth(string, options = {}) {
	if (typeof string !== "string" || string.length === 0) return 0;
	const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options;
	if (!countAnsiEscapeCodes) string = stripAnsi(string);
	if (string.length === 0) return 0;
	let width = 0;
	const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
	for (const { segment: character } of segmenter.segment(string)) {
		const codePoint = character.codePointAt(0);
		if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) continue;
		if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) continue;
		if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) continue;
		if (codePoint >= 55296 && codePoint <= 57343) continue;
		if (codePoint >= 65024 && codePoint <= 65039) continue;
		if (defaultIgnorableCodePointRegex.test(character)) continue;
		if (emoji_regex_default().test(character)) {
			width += 2;
			continue;
		}
		width += eastAsianWidth(codePoint, eastAsianWidthOptions);
	}
	return width;
}
//#endregion
//#region node_modules/cli-truncate/index.js
function getIndexOfNearestSpace(string, wantedIndex, shouldSearchRight) {
	if (string.charAt(wantedIndex) === " ") return wantedIndex;
	const direction = shouldSearchRight ? 1 : -1;
	for (let index = 0; index <= 3; index++) {
		const finalIndex = wantedIndex + index * direction;
		if (string.charAt(finalIndex) === " ") return finalIndex;
	}
	return wantedIndex;
}
function cliTruncate(text, columns, options = {}) {
	const { position = "end", space = false, preferTruncationOnSpace = false } = options;
	let { truncationCharacter = "…" } = options;
	if (typeof text !== "string") throw new TypeError(`Expected \`input\` to be a string, got ${typeof text}`);
	if (typeof columns !== "number") throw new TypeError(`Expected \`columns\` to be a number, got ${typeof columns}`);
	if (columns < 1) return "";
	if (columns === 1) return truncationCharacter;
	const length = stringWidth(text);
	if (length <= columns) return text;
	if (position === "start") {
		if (preferTruncationOnSpace) {
			const nearestSpace = getIndexOfNearestSpace(text, length - columns + 1, true);
			return truncationCharacter + sliceAnsi(text, nearestSpace, length).trim();
		}
		if (space === true) truncationCharacter += " ";
		return truncationCharacter + sliceAnsi(text, length - columns + stringWidth(truncationCharacter), length);
	}
	if (position === "middle") {
		if (space === true) truncationCharacter = ` ${truncationCharacter} `;
		const half = Math.floor(columns / 2);
		if (preferTruncationOnSpace) {
			const spaceNearFirstBreakPoint = getIndexOfNearestSpace(text, half);
			const spaceNearSecondBreakPoint = getIndexOfNearestSpace(text, length - (columns - half) + 1, true);
			return sliceAnsi(text, 0, spaceNearFirstBreakPoint) + truncationCharacter + sliceAnsi(text, spaceNearSecondBreakPoint, length).trim();
		}
		return sliceAnsi(text, 0, half) + truncationCharacter + sliceAnsi(text, length - (columns - half) + stringWidth(truncationCharacter), length);
	}
	if (position === "end") {
		if (preferTruncationOnSpace) return sliceAnsi(text, 0, getIndexOfNearestSpace(text, columns - 1)) + truncationCharacter;
		if (space === true) truncationCharacter = ` ${truncationCharacter}`;
		return sliceAnsi(text, 0, columns - stringWidth(truncationCharacter)) + truncationCharacter;
	}
	throw new Error(`Expected \`options.position\` to be either \`start\`, \`middle\` or \`end\`, got ${position}`);
}
//#endregion
//#region node_modules/path-exists/index.js
function pathExistsSync(path) {
	try {
		fs.accessSync(path);
		return true;
	} catch {
		return false;
	}
}
//#endregion
//#region node_modules/unused-filename/index.js
var MaxTryError = class extends Error {
	constructor(originalPath, lastTriedPath) {
		super("Max tries reached.");
		this.originalPath = originalPath;
		this.lastTriedPath = lastTriedPath;
	}
};
var parenthesesIncrementer = (inputFilename, extension) => {
	const match = inputFilename.match(/^(?<filename>.*)\((?<index>\d+)\)$/);
	let { filename, index } = match ? match.groups : {
		filename: inputFilename,
		index: 0
	};
	filename = filename.trim();
	return [`${filename}${extension}`, `${filename} (${++index})${extension}`];
};
var incrementPath = (filePath, incrementer) => {
	const ext = path.extname(filePath);
	const dirname = path.dirname(filePath);
	const [originalFilename, incrementedFilename] = incrementer(path.basename(filePath, ext), ext);
	return [path.join(dirname, originalFilename), path.join(dirname, incrementedFilename)];
};
function unusedFilenameSync(filePath, { incrementer = parenthesesIncrementer, maxTries = Number.POSITIVE_INFINITY } = {}) {
	let tries = 0;
	let [originalPath] = incrementPath(filePath, incrementer);
	let unusedPath = filePath;
	while (true) {
		if (!pathExistsSync(unusedPath)) return unusedPath;
		if (++tries > maxTries) throw new MaxTryError(originalPath, unusedPath);
		[originalPath, unusedPath] = incrementPath(unusedPath, incrementer);
	}
}
//#endregion
//#region node_modules/escape-goat/index.js
var _htmlEscape = (string) => string.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function htmlEscape(strings, ...values) {
	if (typeof strings === "string") return _htmlEscape(strings);
	let output = strings[0];
	for (const [index, value] of values.entries()) output = output + _htmlEscape(String(value)) + strings[index + 1];
	return output;
}
//#endregion
//#region node_modules/pupa/index.js
var MissingValueError = class extends Error {
	constructor(key) {
		super(`Missing a value for ${key ? `the placeholder: ${key}` : "a placeholder"}`, key);
		this.name = "MissingValueError";
		this.key = key;
	}
};
var MissingFilterError = class extends Error {
	constructor(filterName) {
		super(`Missing filter: ${filterName}`);
		this.name = "MissingFilterError";
		this.filterName = filterName;
	}
};
function pupa(template, data, { ignoreMissing = false, transform = ({ value }) => value, filters = {} } = {}) {
	if (typeof template !== "string") throw new TypeError(`Expected a \`string\` in the first argument, got \`${typeof template}\``);
	if (typeof data !== "object") throw new TypeError(`Expected an \`object\` or \`Array\` in the second argument, got \`${typeof data}\``);
	const escapedLeftBrace = "";
	const escapedRightBrace = "";
	template = template.replace(/\\{/g, escapedLeftBrace);
	template = template.replace(/\\}/g, escapedRightBrace);
	const parseKeyPath = (key) => {
		const segments = [];
		let segment = "";
		for (let index = 0; index < key.length; index++) if (key[index] === "\\" && key[index + 1] === ".") {
			segment += ".";
			index++;
		} else if (key[index] === ".") {
			segments.push(segment);
			segment = "";
		} else segment += key[index];
		segments.push(segment);
		return segments;
	};
	const replace = (placeholder, keyWithFilters) => {
		const parts = keyWithFilters.split("|").map((part) => part.trim());
		const key = parts[0];
		const filterChain = parts.slice(1);
		const segments = parseKeyPath(key);
		let value = data;
		for (const property of segments) if (value) value = value[property];
		for (const filterName of filterChain) {
			const filter = filters[filterName];
			if (!filter) {
				if (ignoreMissing) return placeholder;
				throw new MissingFilterError(filterName);
			}
			if (value !== void 0) value = filter(value);
		}
		const transformedValue = transform({
			value,
			key
		});
		if (transformedValue === void 0) {
			if (ignoreMissing) return placeholder;
			throw new MissingValueError(key);
		}
		return String(transformedValue);
	};
	const keyWithFiltersPattern = `((\\d+|[a-z\$_][\\w\\-.\$\\\\]*)\\s*(?:\\|\\s*[a-z\$_][\\w\$]*\\s*)*)`;
	const doubleBraceRegex = new RegExp(`{{${keyWithFiltersPattern}}}`, "gi");
	const singleBraceRegex = new RegExp(`{${keyWithFiltersPattern}}`, "gi");
	template = template.replace(doubleBraceRegex, (...arguments_) => htmlEscape(replace(...arguments_)));
	template = template.replace(singleBraceRegex, replace);
	template = template.replace(new RegExp(escapedLeftBrace, "g"), "{");
	template = template.replace(new RegExp(escapedRightBrace, "g"), "}");
	return template;
}
//#endregion
//#region node_modules/mime-db/db.json
var db_exports = /* @__PURE__ */ __exportAll({ default: () => db_default });
var db_default;
var init_db = __esmMin((() => {
	db_default = {
		"application/1d-interleaved-parityfec": { "source": "iana" },
		"application/3gpdash-qoe-report+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/3gpp-ims+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/3gpphal+json": {
			"source": "iana",
			"compressible": true
		},
		"application/3gpphalforms+json": {
			"source": "iana",
			"compressible": true
		},
		"application/a2l": { "source": "iana" },
		"application/ace+cbor": { "source": "iana" },
		"application/activemessage": { "source": "iana" },
		"application/activity+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-costmap+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-costmapfilter+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-directory+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-endpointcost+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-endpointcostparams+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-endpointprop+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-endpointpropparams+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-error+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-networkmap+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-networkmapfilter+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-updatestreamcontrol+json": {
			"source": "iana",
			"compressible": true
		},
		"application/alto-updatestreamparams+json": {
			"source": "iana",
			"compressible": true
		},
		"application/aml": { "source": "iana" },
		"application/andrew-inset": {
			"source": "iana",
			"extensions": ["ez"]
		},
		"application/applefile": { "source": "iana" },
		"application/applixware": {
			"source": "apache",
			"extensions": ["aw"]
		},
		"application/at+jwt": { "source": "iana" },
		"application/atf": { "source": "iana" },
		"application/atfx": { "source": "iana" },
		"application/atom+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["atom"]
		},
		"application/atomcat+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["atomcat"]
		},
		"application/atomdeleted+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["atomdeleted"]
		},
		"application/atomicmail": { "source": "iana" },
		"application/atomsvc+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["atomsvc"]
		},
		"application/atsc-dwd+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["dwd"]
		},
		"application/atsc-dynamic-event-message": { "source": "iana" },
		"application/atsc-held+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["held"]
		},
		"application/atsc-rdt+json": {
			"source": "iana",
			"compressible": true
		},
		"application/atsc-rsat+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rsat"]
		},
		"application/atxml": { "source": "iana" },
		"application/auth-policy+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/bacnet-xdd+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/batch-smtp": { "source": "iana" },
		"application/bdoc": {
			"compressible": false,
			"extensions": ["bdoc"]
		},
		"application/beep+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/calendar+json": {
			"source": "iana",
			"compressible": true
		},
		"application/calendar+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xcs"]
		},
		"application/call-completion": { "source": "iana" },
		"application/cals-1840": { "source": "iana" },
		"application/captive+json": {
			"source": "iana",
			"compressible": true
		},
		"application/cbor": { "source": "iana" },
		"application/cbor-seq": { "source": "iana" },
		"application/cccex": { "source": "iana" },
		"application/ccmp+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/ccxml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["ccxml"]
		},
		"application/cdfx+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["cdfx"]
		},
		"application/cdmi-capability": {
			"source": "iana",
			"extensions": ["cdmia"]
		},
		"application/cdmi-container": {
			"source": "iana",
			"extensions": ["cdmic"]
		},
		"application/cdmi-domain": {
			"source": "iana",
			"extensions": ["cdmid"]
		},
		"application/cdmi-object": {
			"source": "iana",
			"extensions": ["cdmio"]
		},
		"application/cdmi-queue": {
			"source": "iana",
			"extensions": ["cdmiq"]
		},
		"application/cdni": { "source": "iana" },
		"application/cea": { "source": "iana" },
		"application/cea-2018+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/cellml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/cfw": { "source": "iana" },
		"application/city+json": {
			"source": "iana",
			"compressible": true
		},
		"application/clr": { "source": "iana" },
		"application/clue+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/clue_info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/cms": { "source": "iana" },
		"application/cnrp+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/coap-group+json": {
			"source": "iana",
			"compressible": true
		},
		"application/coap-payload": { "source": "iana" },
		"application/commonground": { "source": "iana" },
		"application/conference-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/cose": { "source": "iana" },
		"application/cose-key": { "source": "iana" },
		"application/cose-key-set": { "source": "iana" },
		"application/cpl+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["cpl"]
		},
		"application/csrattrs": { "source": "iana" },
		"application/csta+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/cstadata+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/csvm+json": {
			"source": "iana",
			"compressible": true
		},
		"application/cu-seeme": {
			"source": "apache",
			"extensions": ["cu"]
		},
		"application/cwt": { "source": "iana" },
		"application/cybercash": { "source": "iana" },
		"application/dart": { "compressible": true },
		"application/dash+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mpd"]
		},
		"application/dash-patch+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mpp"]
		},
		"application/dashdelta": { "source": "iana" },
		"application/davmount+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["davmount"]
		},
		"application/dca-rft": { "source": "iana" },
		"application/dcd": { "source": "iana" },
		"application/dec-dx": { "source": "iana" },
		"application/dialog-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/dicom": { "source": "iana" },
		"application/dicom+json": {
			"source": "iana",
			"compressible": true
		},
		"application/dicom+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/dii": { "source": "iana" },
		"application/dit": { "source": "iana" },
		"application/dns": { "source": "iana" },
		"application/dns+json": {
			"source": "iana",
			"compressible": true
		},
		"application/dns-message": { "source": "iana" },
		"application/docbook+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["dbk"]
		},
		"application/dots+cbor": { "source": "iana" },
		"application/dskpp+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/dssc+der": {
			"source": "iana",
			"extensions": ["dssc"]
		},
		"application/dssc+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xdssc"]
		},
		"application/dvcs": { "source": "iana" },
		"application/ecmascript": {
			"source": "iana",
			"compressible": true,
			"extensions": ["es", "ecma"]
		},
		"application/edi-consent": { "source": "iana" },
		"application/edi-x12": {
			"source": "iana",
			"compressible": false
		},
		"application/edifact": {
			"source": "iana",
			"compressible": false
		},
		"application/efi": { "source": "iana" },
		"application/elm+json": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/elm+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emergencycalldata.cap+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/emergencycalldata.comment+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emergencycalldata.control+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emergencycalldata.deviceinfo+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emergencycalldata.ecall.msd": { "source": "iana" },
		"application/emergencycalldata.providerinfo+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emergencycalldata.serviceinfo+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emergencycalldata.subscriberinfo+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emergencycalldata.veds+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/emma+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["emma"]
		},
		"application/emotionml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["emotionml"]
		},
		"application/encaprtp": { "source": "iana" },
		"application/epp+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/epub+zip": {
			"source": "iana",
			"compressible": false,
			"extensions": ["epub"]
		},
		"application/eshop": { "source": "iana" },
		"application/exi": {
			"source": "iana",
			"extensions": ["exi"]
		},
		"application/expect-ct-report+json": {
			"source": "iana",
			"compressible": true
		},
		"application/express": {
			"source": "iana",
			"extensions": ["exp"]
		},
		"application/fastinfoset": { "source": "iana" },
		"application/fastsoap": { "source": "iana" },
		"application/fdt+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["fdt"]
		},
		"application/fhir+json": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/fhir+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/fido.trusted-apps+json": { "compressible": true },
		"application/fits": { "source": "iana" },
		"application/flexfec": { "source": "iana" },
		"application/font-sfnt": { "source": "iana" },
		"application/font-tdpfr": {
			"source": "iana",
			"extensions": ["pfr"]
		},
		"application/font-woff": {
			"source": "iana",
			"compressible": false
		},
		"application/framework-attributes+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/geo+json": {
			"source": "iana",
			"compressible": true,
			"extensions": ["geojson"]
		},
		"application/geo+json-seq": { "source": "iana" },
		"application/geopackage+sqlite3": { "source": "iana" },
		"application/geoxacml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/gltf-buffer": { "source": "iana" },
		"application/gml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["gml"]
		},
		"application/gpx+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["gpx"]
		},
		"application/gxf": {
			"source": "apache",
			"extensions": ["gxf"]
		},
		"application/gzip": {
			"source": "iana",
			"compressible": false,
			"extensions": ["gz"]
		},
		"application/h224": { "source": "iana" },
		"application/held+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/hjson": { "extensions": ["hjson"] },
		"application/http": { "source": "iana" },
		"application/hyperstudio": {
			"source": "iana",
			"extensions": ["stk"]
		},
		"application/ibe-key-request+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/ibe-pkg-reply+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/ibe-pp-data": { "source": "iana" },
		"application/iges": { "source": "iana" },
		"application/im-iscomposing+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/index": { "source": "iana" },
		"application/index.cmd": { "source": "iana" },
		"application/index.obj": { "source": "iana" },
		"application/index.response": { "source": "iana" },
		"application/index.vnd": { "source": "iana" },
		"application/inkml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["ink", "inkml"]
		},
		"application/iotp": { "source": "iana" },
		"application/ipfix": {
			"source": "iana",
			"extensions": ["ipfix"]
		},
		"application/ipp": { "source": "iana" },
		"application/isup": { "source": "iana" },
		"application/its+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["its"]
		},
		"application/java-archive": {
			"source": "apache",
			"compressible": false,
			"extensions": [
				"jar",
				"war",
				"ear"
			]
		},
		"application/java-serialized-object": {
			"source": "apache",
			"compressible": false,
			"extensions": ["ser"]
		},
		"application/java-vm": {
			"source": "apache",
			"compressible": false,
			"extensions": ["class"]
		},
		"application/javascript": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["js", "mjs"]
		},
		"application/jf2feed+json": {
			"source": "iana",
			"compressible": true
		},
		"application/jose": { "source": "iana" },
		"application/jose+json": {
			"source": "iana",
			"compressible": true
		},
		"application/jrd+json": {
			"source": "iana",
			"compressible": true
		},
		"application/jscalendar+json": {
			"source": "iana",
			"compressible": true
		},
		"application/json": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["json", "map"]
		},
		"application/json-patch+json": {
			"source": "iana",
			"compressible": true
		},
		"application/json-seq": { "source": "iana" },
		"application/json5": { "extensions": ["json5"] },
		"application/jsonml+json": {
			"source": "apache",
			"compressible": true,
			"extensions": ["jsonml"]
		},
		"application/jwk+json": {
			"source": "iana",
			"compressible": true
		},
		"application/jwk-set+json": {
			"source": "iana",
			"compressible": true
		},
		"application/jwt": { "source": "iana" },
		"application/kpml-request+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/kpml-response+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/ld+json": {
			"source": "iana",
			"compressible": true,
			"extensions": ["jsonld"]
		},
		"application/lgr+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["lgr"]
		},
		"application/link-format": { "source": "iana" },
		"application/load-control+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/lost+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["lostxml"]
		},
		"application/lostsync+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/lpf+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/lxf": { "source": "iana" },
		"application/mac-binhex40": {
			"source": "iana",
			"extensions": ["hqx"]
		},
		"application/mac-compactpro": {
			"source": "apache",
			"extensions": ["cpt"]
		},
		"application/macwriteii": { "source": "iana" },
		"application/mads+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mads"]
		},
		"application/manifest+json": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["webmanifest"]
		},
		"application/marc": {
			"source": "iana",
			"extensions": ["mrc"]
		},
		"application/marcxml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mrcx"]
		},
		"application/mathematica": {
			"source": "iana",
			"extensions": [
				"ma",
				"nb",
				"mb"
			]
		},
		"application/mathml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mathml"]
		},
		"application/mathml-content+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mathml-presentation+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-associated-procedure-description+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-deregister+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-envelope+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-msk+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-msk-response+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-protection-description+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-reception-report+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-register+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-register-response+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-schedule+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbms-user-service-description+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mbox": {
			"source": "iana",
			"extensions": ["mbox"]
		},
		"application/media-policy-dataset+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mpf"]
		},
		"application/media_control+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mediaservercontrol+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mscml"]
		},
		"application/merge-patch+json": {
			"source": "iana",
			"compressible": true
		},
		"application/metalink+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["metalink"]
		},
		"application/metalink4+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["meta4"]
		},
		"application/mets+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mets"]
		},
		"application/mf4": { "source": "iana" },
		"application/mikey": { "source": "iana" },
		"application/mipc": { "source": "iana" },
		"application/missing-blocks+cbor-seq": { "source": "iana" },
		"application/mmt-aei+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["maei"]
		},
		"application/mmt-usd+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["musd"]
		},
		"application/mods+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mods"]
		},
		"application/moss-keys": { "source": "iana" },
		"application/moss-signature": { "source": "iana" },
		"application/mosskey-data": { "source": "iana" },
		"application/mosskey-request": { "source": "iana" },
		"application/mp21": {
			"source": "iana",
			"extensions": ["m21", "mp21"]
		},
		"application/mp4": {
			"source": "iana",
			"extensions": ["mp4s", "m4p"]
		},
		"application/mpeg4-generic": { "source": "iana" },
		"application/mpeg4-iod": { "source": "iana" },
		"application/mpeg4-iod-xmt": { "source": "iana" },
		"application/mrb-consumer+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/mrb-publish+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/msc-ivr+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/msc-mixer+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/msword": {
			"source": "iana",
			"compressible": false,
			"extensions": ["doc", "dot"]
		},
		"application/mud+json": {
			"source": "iana",
			"compressible": true
		},
		"application/multipart-core": { "source": "iana" },
		"application/mxf": {
			"source": "iana",
			"extensions": ["mxf"]
		},
		"application/n-quads": {
			"source": "iana",
			"extensions": ["nq"]
		},
		"application/n-triples": {
			"source": "iana",
			"extensions": ["nt"]
		},
		"application/nasdata": { "source": "iana" },
		"application/news-checkgroups": {
			"source": "iana",
			"charset": "US-ASCII"
		},
		"application/news-groupinfo": {
			"source": "iana",
			"charset": "US-ASCII"
		},
		"application/news-transmission": { "source": "iana" },
		"application/nlsml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/node": {
			"source": "iana",
			"extensions": ["cjs"]
		},
		"application/nss": { "source": "iana" },
		"application/oauth-authz-req+jwt": { "source": "iana" },
		"application/oblivious-dns-message": { "source": "iana" },
		"application/ocsp-request": { "source": "iana" },
		"application/ocsp-response": { "source": "iana" },
		"application/octet-stream": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"bin",
				"dms",
				"lrf",
				"mar",
				"so",
				"dist",
				"distz",
				"pkg",
				"bpk",
				"dump",
				"elc",
				"deploy",
				"exe",
				"dll",
				"deb",
				"dmg",
				"iso",
				"img",
				"msi",
				"msp",
				"msm",
				"buffer"
			]
		},
		"application/oda": {
			"source": "iana",
			"extensions": ["oda"]
		},
		"application/odm+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/odx": { "source": "iana" },
		"application/oebps-package+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["opf"]
		},
		"application/ogg": {
			"source": "iana",
			"compressible": false,
			"extensions": ["ogx"]
		},
		"application/omdoc+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["omdoc"]
		},
		"application/onenote": {
			"source": "apache",
			"extensions": [
				"onetoc",
				"onetoc2",
				"onetmp",
				"onepkg"
			]
		},
		"application/opc-nodeset+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/oscore": { "source": "iana" },
		"application/oxps": {
			"source": "iana",
			"extensions": ["oxps"]
		},
		"application/p21": { "source": "iana" },
		"application/p21+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/p2p-overlay+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["relo"]
		},
		"application/parityfec": { "source": "iana" },
		"application/passport": { "source": "iana" },
		"application/patch-ops-error+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xer"]
		},
		"application/pdf": {
			"source": "iana",
			"compressible": false,
			"extensions": ["pdf"]
		},
		"application/pdx": { "source": "iana" },
		"application/pem-certificate-chain": { "source": "iana" },
		"application/pgp-encrypted": {
			"source": "iana",
			"compressible": false,
			"extensions": ["pgp"]
		},
		"application/pgp-keys": {
			"source": "iana",
			"extensions": ["asc"]
		},
		"application/pgp-signature": {
			"source": "iana",
			"extensions": ["asc", "sig"]
		},
		"application/pics-rules": {
			"source": "apache",
			"extensions": ["prf"]
		},
		"application/pidf+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/pidf-diff+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/pkcs10": {
			"source": "iana",
			"extensions": ["p10"]
		},
		"application/pkcs12": { "source": "iana" },
		"application/pkcs7-mime": {
			"source": "iana",
			"extensions": ["p7m", "p7c"]
		},
		"application/pkcs7-signature": {
			"source": "iana",
			"extensions": ["p7s"]
		},
		"application/pkcs8": {
			"source": "iana",
			"extensions": ["p8"]
		},
		"application/pkcs8-encrypted": { "source": "iana" },
		"application/pkix-attr-cert": {
			"source": "iana",
			"extensions": ["ac"]
		},
		"application/pkix-cert": {
			"source": "iana",
			"extensions": ["cer"]
		},
		"application/pkix-crl": {
			"source": "iana",
			"extensions": ["crl"]
		},
		"application/pkix-pkipath": {
			"source": "iana",
			"extensions": ["pkipath"]
		},
		"application/pkixcmp": {
			"source": "iana",
			"extensions": ["pki"]
		},
		"application/pls+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["pls"]
		},
		"application/poc-settings+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/postscript": {
			"source": "iana",
			"compressible": true,
			"extensions": [
				"ai",
				"eps",
				"ps"
			]
		},
		"application/ppsp-tracker+json": {
			"source": "iana",
			"compressible": true
		},
		"application/problem+json": {
			"source": "iana",
			"compressible": true
		},
		"application/problem+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/provenance+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["provx"]
		},
		"application/prs.alvestrand.titrax-sheet": { "source": "iana" },
		"application/prs.cww": {
			"source": "iana",
			"extensions": ["cww"]
		},
		"application/prs.cyn": {
			"source": "iana",
			"charset": "7-BIT"
		},
		"application/prs.hpub+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/prs.nprend": { "source": "iana" },
		"application/prs.plucker": { "source": "iana" },
		"application/prs.rdf-xml-crypt": { "source": "iana" },
		"application/prs.xsf+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/pskc+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["pskcxml"]
		},
		"application/pvd+json": {
			"source": "iana",
			"compressible": true
		},
		"application/qsig": { "source": "iana" },
		"application/raml+yaml": {
			"compressible": true,
			"extensions": ["raml"]
		},
		"application/raptorfec": { "source": "iana" },
		"application/rdap+json": {
			"source": "iana",
			"compressible": true
		},
		"application/rdf+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rdf", "owl"]
		},
		"application/reginfo+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rif"]
		},
		"application/relax-ng-compact-syntax": {
			"source": "iana",
			"extensions": ["rnc"]
		},
		"application/remote-printing": { "source": "iana" },
		"application/reputon+json": {
			"source": "iana",
			"compressible": true
		},
		"application/resource-lists+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rl"]
		},
		"application/resource-lists-diff+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rld"]
		},
		"application/rfc+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/riscos": { "source": "iana" },
		"application/rlmi+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/rls-services+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rs"]
		},
		"application/route-apd+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rapd"]
		},
		"application/route-s-tsid+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["sls"]
		},
		"application/route-usd+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rusd"]
		},
		"application/rpki-ghostbusters": {
			"source": "iana",
			"extensions": ["gbr"]
		},
		"application/rpki-manifest": {
			"source": "iana",
			"extensions": ["mft"]
		},
		"application/rpki-publication": { "source": "iana" },
		"application/rpki-roa": {
			"source": "iana",
			"extensions": ["roa"]
		},
		"application/rpki-updown": { "source": "iana" },
		"application/rsd+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["rsd"]
		},
		"application/rss+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["rss"]
		},
		"application/rtf": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rtf"]
		},
		"application/rtploopback": { "source": "iana" },
		"application/rtx": { "source": "iana" },
		"application/samlassertion+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/samlmetadata+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/sarif+json": {
			"source": "iana",
			"compressible": true
		},
		"application/sarif-external-properties+json": {
			"source": "iana",
			"compressible": true
		},
		"application/sbe": { "source": "iana" },
		"application/sbml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["sbml"]
		},
		"application/scaip+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/scim+json": {
			"source": "iana",
			"compressible": true
		},
		"application/scvp-cv-request": {
			"source": "iana",
			"extensions": ["scq"]
		},
		"application/scvp-cv-response": {
			"source": "iana",
			"extensions": ["scs"]
		},
		"application/scvp-vp-request": {
			"source": "iana",
			"extensions": ["spq"]
		},
		"application/scvp-vp-response": {
			"source": "iana",
			"extensions": ["spp"]
		},
		"application/sdp": {
			"source": "iana",
			"extensions": ["sdp"]
		},
		"application/secevent+jwt": { "source": "iana" },
		"application/senml+cbor": { "source": "iana" },
		"application/senml+json": {
			"source": "iana",
			"compressible": true
		},
		"application/senml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["senmlx"]
		},
		"application/senml-etch+cbor": { "source": "iana" },
		"application/senml-etch+json": {
			"source": "iana",
			"compressible": true
		},
		"application/senml-exi": { "source": "iana" },
		"application/sensml+cbor": { "source": "iana" },
		"application/sensml+json": {
			"source": "iana",
			"compressible": true
		},
		"application/sensml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["sensmlx"]
		},
		"application/sensml-exi": { "source": "iana" },
		"application/sep+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/sep-exi": { "source": "iana" },
		"application/session-info": { "source": "iana" },
		"application/set-payment": { "source": "iana" },
		"application/set-payment-initiation": {
			"source": "iana",
			"extensions": ["setpay"]
		},
		"application/set-registration": { "source": "iana" },
		"application/set-registration-initiation": {
			"source": "iana",
			"extensions": ["setreg"]
		},
		"application/sgml": { "source": "iana" },
		"application/sgml-open-catalog": { "source": "iana" },
		"application/shf+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["shf"]
		},
		"application/sieve": {
			"source": "iana",
			"extensions": ["siv", "sieve"]
		},
		"application/simple-filter+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/simple-message-summary": { "source": "iana" },
		"application/simplesymbolcontainer": { "source": "iana" },
		"application/sipc": { "source": "iana" },
		"application/slate": { "source": "iana" },
		"application/smil": { "source": "iana" },
		"application/smil+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["smi", "smil"]
		},
		"application/smpte336m": { "source": "iana" },
		"application/soap+fastinfoset": { "source": "iana" },
		"application/soap+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/sparql-query": {
			"source": "iana",
			"extensions": ["rq"]
		},
		"application/sparql-results+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["srx"]
		},
		"application/spdx+json": {
			"source": "iana",
			"compressible": true
		},
		"application/spirits-event+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/sql": { "source": "iana" },
		"application/srgs": {
			"source": "iana",
			"extensions": ["gram"]
		},
		"application/srgs+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["grxml"]
		},
		"application/sru+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["sru"]
		},
		"application/ssdl+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["ssdl"]
		},
		"application/ssml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["ssml"]
		},
		"application/stix+json": {
			"source": "iana",
			"compressible": true
		},
		"application/swid+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["swidtag"]
		},
		"application/tamp-apex-update": { "source": "iana" },
		"application/tamp-apex-update-confirm": { "source": "iana" },
		"application/tamp-community-update": { "source": "iana" },
		"application/tamp-community-update-confirm": { "source": "iana" },
		"application/tamp-error": { "source": "iana" },
		"application/tamp-sequence-adjust": { "source": "iana" },
		"application/tamp-sequence-adjust-confirm": { "source": "iana" },
		"application/tamp-status-query": { "source": "iana" },
		"application/tamp-status-response": { "source": "iana" },
		"application/tamp-update": { "source": "iana" },
		"application/tamp-update-confirm": { "source": "iana" },
		"application/tar": { "compressible": true },
		"application/taxii+json": {
			"source": "iana",
			"compressible": true
		},
		"application/td+json": {
			"source": "iana",
			"compressible": true
		},
		"application/tei+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["tei", "teicorpus"]
		},
		"application/tetra_isi": { "source": "iana" },
		"application/thraud+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["tfi"]
		},
		"application/timestamp-query": { "source": "iana" },
		"application/timestamp-reply": { "source": "iana" },
		"application/timestamped-data": {
			"source": "iana",
			"extensions": ["tsd"]
		},
		"application/tlsrpt+gzip": { "source": "iana" },
		"application/tlsrpt+json": {
			"source": "iana",
			"compressible": true
		},
		"application/tnauthlist": { "source": "iana" },
		"application/token-introspection+jwt": { "source": "iana" },
		"application/toml": {
			"compressible": true,
			"extensions": ["toml"]
		},
		"application/trickle-ice-sdpfrag": { "source": "iana" },
		"application/trig": {
			"source": "iana",
			"extensions": ["trig"]
		},
		"application/ttml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["ttml"]
		},
		"application/tve-trigger": { "source": "iana" },
		"application/tzif": { "source": "iana" },
		"application/tzif-leap": { "source": "iana" },
		"application/ubjson": {
			"compressible": false,
			"extensions": ["ubj"]
		},
		"application/ulpfec": { "source": "iana" },
		"application/urc-grpsheet+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/urc-ressheet+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rsheet"]
		},
		"application/urc-targetdesc+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["td"]
		},
		"application/urc-uisocketdesc+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vcard+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vcard+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vemmi": { "source": "iana" },
		"application/vividence.scriptfile": { "source": "apache" },
		"application/vnd.1000minds.decision-model+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["1km"]
		},
		"application/vnd.3gpp-prose+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp-prose-pc3ch+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp-v2x-local-service-information": { "source": "iana" },
		"application/vnd.3gpp.5gnas": { "source": "iana" },
		"application/vnd.3gpp.access-transfer-events+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.bsf+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.gmop+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.gtpc": { "source": "iana" },
		"application/vnd.3gpp.interworking-data": { "source": "iana" },
		"application/vnd.3gpp.lpp": { "source": "iana" },
		"application/vnd.3gpp.mc-signalling-ear": { "source": "iana" },
		"application/vnd.3gpp.mcdata-affiliation-command+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcdata-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcdata-payload": { "source": "iana" },
		"application/vnd.3gpp.mcdata-service-config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcdata-signalling": { "source": "iana" },
		"application/vnd.3gpp.mcdata-ue-config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcdata-user-profile+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-affiliation-command+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-floor-request+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-location-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-service-config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-signed+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-ue-config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-ue-init-config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcptt-user-profile+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-affiliation-command+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-affiliation-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-location-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-service-config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-transmission-request+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-ue-config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mcvideo-user-profile+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.mid-call+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.ngap": { "source": "iana" },
		"application/vnd.3gpp.pfcp": { "source": "iana" },
		"application/vnd.3gpp.pic-bw-large": {
			"source": "iana",
			"extensions": ["plb"]
		},
		"application/vnd.3gpp.pic-bw-small": {
			"source": "iana",
			"extensions": ["psb"]
		},
		"application/vnd.3gpp.pic-bw-var": {
			"source": "iana",
			"extensions": ["pvb"]
		},
		"application/vnd.3gpp.s1ap": { "source": "iana" },
		"application/vnd.3gpp.sms": { "source": "iana" },
		"application/vnd.3gpp.sms+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.srvcc-ext+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.srvcc-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.state-and-event-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp.ussd+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp2.bcmcsinfo+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.3gpp2.sms": { "source": "iana" },
		"application/vnd.3gpp2.tcap": {
			"source": "iana",
			"extensions": ["tcap"]
		},
		"application/vnd.3lightssoftware.imagescal": { "source": "iana" },
		"application/vnd.3m.post-it-notes": {
			"source": "iana",
			"extensions": ["pwn"]
		},
		"application/vnd.accpac.simply.aso": {
			"source": "iana",
			"extensions": ["aso"]
		},
		"application/vnd.accpac.simply.imp": {
			"source": "iana",
			"extensions": ["imp"]
		},
		"application/vnd.acucobol": {
			"source": "iana",
			"extensions": ["acu"]
		},
		"application/vnd.acucorp": {
			"source": "iana",
			"extensions": ["atc", "acutc"]
		},
		"application/vnd.adobe.air-application-installer-package+zip": {
			"source": "apache",
			"compressible": false,
			"extensions": ["air"]
		},
		"application/vnd.adobe.flash.movie": { "source": "iana" },
		"application/vnd.adobe.formscentral.fcdt": {
			"source": "iana",
			"extensions": ["fcdt"]
		},
		"application/vnd.adobe.fxp": {
			"source": "iana",
			"extensions": ["fxp", "fxpl"]
		},
		"application/vnd.adobe.partial-upload": { "source": "iana" },
		"application/vnd.adobe.xdp+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xdp"]
		},
		"application/vnd.adobe.xfdf": {
			"source": "iana",
			"extensions": ["xfdf"]
		},
		"application/vnd.aether.imp": { "source": "iana" },
		"application/vnd.afpc.afplinedata": { "source": "iana" },
		"application/vnd.afpc.afplinedata-pagedef": { "source": "iana" },
		"application/vnd.afpc.cmoca-cmresource": { "source": "iana" },
		"application/vnd.afpc.foca-charset": { "source": "iana" },
		"application/vnd.afpc.foca-codedfont": { "source": "iana" },
		"application/vnd.afpc.foca-codepage": { "source": "iana" },
		"application/vnd.afpc.modca": { "source": "iana" },
		"application/vnd.afpc.modca-cmtable": { "source": "iana" },
		"application/vnd.afpc.modca-formdef": { "source": "iana" },
		"application/vnd.afpc.modca-mediummap": { "source": "iana" },
		"application/vnd.afpc.modca-objectcontainer": { "source": "iana" },
		"application/vnd.afpc.modca-overlay": { "source": "iana" },
		"application/vnd.afpc.modca-pagesegment": { "source": "iana" },
		"application/vnd.age": {
			"source": "iana",
			"extensions": ["age"]
		},
		"application/vnd.ah-barcode": { "source": "iana" },
		"application/vnd.ahead.space": {
			"source": "iana",
			"extensions": ["ahead"]
		},
		"application/vnd.airzip.filesecure.azf": {
			"source": "iana",
			"extensions": ["azf"]
		},
		"application/vnd.airzip.filesecure.azs": {
			"source": "iana",
			"extensions": ["azs"]
		},
		"application/vnd.amadeus+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.amazon.ebook": {
			"source": "apache",
			"extensions": ["azw"]
		},
		"application/vnd.amazon.mobi8-ebook": { "source": "iana" },
		"application/vnd.americandynamics.acc": {
			"source": "iana",
			"extensions": ["acc"]
		},
		"application/vnd.amiga.ami": {
			"source": "iana",
			"extensions": ["ami"]
		},
		"application/vnd.amundsen.maze+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.android.ota": { "source": "iana" },
		"application/vnd.android.package-archive": {
			"source": "apache",
			"compressible": false,
			"extensions": ["apk"]
		},
		"application/vnd.anki": { "source": "iana" },
		"application/vnd.anser-web-certificate-issue-initiation": {
			"source": "iana",
			"extensions": ["cii"]
		},
		"application/vnd.anser-web-funds-transfer-initiation": {
			"source": "apache",
			"extensions": ["fti"]
		},
		"application/vnd.antix.game-component": {
			"source": "iana",
			"extensions": ["atx"]
		},
		"application/vnd.apache.arrow.file": { "source": "iana" },
		"application/vnd.apache.arrow.stream": { "source": "iana" },
		"application/vnd.apache.thrift.binary": { "source": "iana" },
		"application/vnd.apache.thrift.compact": { "source": "iana" },
		"application/vnd.apache.thrift.json": { "source": "iana" },
		"application/vnd.api+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.aplextor.warrp+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.apothekende.reservation+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.apple.installer+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["mpkg"]
		},
		"application/vnd.apple.keynote": {
			"source": "iana",
			"extensions": ["key"]
		},
		"application/vnd.apple.mpegurl": {
			"source": "iana",
			"extensions": ["m3u8"]
		},
		"application/vnd.apple.numbers": {
			"source": "iana",
			"extensions": ["numbers"]
		},
		"application/vnd.apple.pages": {
			"source": "iana",
			"extensions": ["pages"]
		},
		"application/vnd.apple.pkpass": {
			"compressible": false,
			"extensions": ["pkpass"]
		},
		"application/vnd.arastra.swi": { "source": "iana" },
		"application/vnd.aristanetworks.swi": {
			"source": "iana",
			"extensions": ["swi"]
		},
		"application/vnd.artisan+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.artsquare": { "source": "iana" },
		"application/vnd.astraea-software.iota": {
			"source": "iana",
			"extensions": ["iota"]
		},
		"application/vnd.audiograph": {
			"source": "iana",
			"extensions": ["aep"]
		},
		"application/vnd.autopackage": { "source": "iana" },
		"application/vnd.avalon+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.avistar+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.balsamiq.bmml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["bmml"]
		},
		"application/vnd.balsamiq.bmpr": { "source": "iana" },
		"application/vnd.banana-accounting": { "source": "iana" },
		"application/vnd.bbf.usp.error": { "source": "iana" },
		"application/vnd.bbf.usp.msg": { "source": "iana" },
		"application/vnd.bbf.usp.msg+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.bekitzur-stech+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.bint.med-content": { "source": "iana" },
		"application/vnd.biopax.rdf+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.blink-idb-value-wrapper": { "source": "iana" },
		"application/vnd.blueice.multipass": {
			"source": "iana",
			"extensions": ["mpm"]
		},
		"application/vnd.bluetooth.ep.oob": { "source": "iana" },
		"application/vnd.bluetooth.le.oob": { "source": "iana" },
		"application/vnd.bmi": {
			"source": "iana",
			"extensions": ["bmi"]
		},
		"application/vnd.bpf": { "source": "iana" },
		"application/vnd.bpf3": { "source": "iana" },
		"application/vnd.businessobjects": {
			"source": "iana",
			"extensions": ["rep"]
		},
		"application/vnd.byu.uapi+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.cab-jscript": { "source": "iana" },
		"application/vnd.canon-cpdl": { "source": "iana" },
		"application/vnd.canon-lips": { "source": "iana" },
		"application/vnd.capasystems-pg+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.cendio.thinlinc.clientconf": { "source": "iana" },
		"application/vnd.century-systems.tcp_stream": { "source": "iana" },
		"application/vnd.chemdraw+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["cdxml"]
		},
		"application/vnd.chess-pgn": { "source": "iana" },
		"application/vnd.chipnuts.karaoke-mmd": {
			"source": "iana",
			"extensions": ["mmd"]
		},
		"application/vnd.ciedi": { "source": "iana" },
		"application/vnd.cinderella": {
			"source": "iana",
			"extensions": ["cdy"]
		},
		"application/vnd.cirpack.isdn-ext": { "source": "iana" },
		"application/vnd.citationstyles.style+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["csl"]
		},
		"application/vnd.claymore": {
			"source": "iana",
			"extensions": ["cla"]
		},
		"application/vnd.cloanto.rp9": {
			"source": "iana",
			"extensions": ["rp9"]
		},
		"application/vnd.clonk.c4group": {
			"source": "iana",
			"extensions": [
				"c4g",
				"c4d",
				"c4f",
				"c4p",
				"c4u"
			]
		},
		"application/vnd.cluetrust.cartomobile-config": {
			"source": "iana",
			"extensions": ["c11amc"]
		},
		"application/vnd.cluetrust.cartomobile-config-pkg": {
			"source": "iana",
			"extensions": ["c11amz"]
		},
		"application/vnd.coffeescript": { "source": "iana" },
		"application/vnd.collabio.xodocuments.document": { "source": "iana" },
		"application/vnd.collabio.xodocuments.document-template": { "source": "iana" },
		"application/vnd.collabio.xodocuments.presentation": { "source": "iana" },
		"application/vnd.collabio.xodocuments.presentation-template": { "source": "iana" },
		"application/vnd.collabio.xodocuments.spreadsheet": { "source": "iana" },
		"application/vnd.collabio.xodocuments.spreadsheet-template": { "source": "iana" },
		"application/vnd.collection+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.collection.doc+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.collection.next+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.comicbook+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.comicbook-rar": { "source": "iana" },
		"application/vnd.commerce-battelle": { "source": "iana" },
		"application/vnd.commonspace": {
			"source": "iana",
			"extensions": ["csp"]
		},
		"application/vnd.contact.cmsg": {
			"source": "iana",
			"extensions": ["cdbcmsg"]
		},
		"application/vnd.coreos.ignition+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.cosmocaller": {
			"source": "iana",
			"extensions": ["cmc"]
		},
		"application/vnd.crick.clicker": {
			"source": "iana",
			"extensions": ["clkx"]
		},
		"application/vnd.crick.clicker.keyboard": {
			"source": "iana",
			"extensions": ["clkk"]
		},
		"application/vnd.crick.clicker.palette": {
			"source": "iana",
			"extensions": ["clkp"]
		},
		"application/vnd.crick.clicker.template": {
			"source": "iana",
			"extensions": ["clkt"]
		},
		"application/vnd.crick.clicker.wordbank": {
			"source": "iana",
			"extensions": ["clkw"]
		},
		"application/vnd.criticaltools.wbs+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["wbs"]
		},
		"application/vnd.cryptii.pipe+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.crypto-shade-file": { "source": "iana" },
		"application/vnd.cryptomator.encrypted": { "source": "iana" },
		"application/vnd.cryptomator.vault": { "source": "iana" },
		"application/vnd.ctc-posml": {
			"source": "iana",
			"extensions": ["pml"]
		},
		"application/vnd.ctct.ws+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.cups-pdf": { "source": "iana" },
		"application/vnd.cups-postscript": { "source": "iana" },
		"application/vnd.cups-ppd": {
			"source": "iana",
			"extensions": ["ppd"]
		},
		"application/vnd.cups-raster": { "source": "iana" },
		"application/vnd.cups-raw": { "source": "iana" },
		"application/vnd.curl": { "source": "iana" },
		"application/vnd.curl.car": {
			"source": "apache",
			"extensions": ["car"]
		},
		"application/vnd.curl.pcurl": {
			"source": "apache",
			"extensions": ["pcurl"]
		},
		"application/vnd.cyan.dean.root+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.cybank": { "source": "iana" },
		"application/vnd.cyclonedx+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.cyclonedx+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.d2l.coursepackage1p0+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.d3m-dataset": { "source": "iana" },
		"application/vnd.d3m-problem": { "source": "iana" },
		"application/vnd.dart": {
			"source": "iana",
			"compressible": true,
			"extensions": ["dart"]
		},
		"application/vnd.data-vision.rdz": {
			"source": "iana",
			"extensions": ["rdz"]
		},
		"application/vnd.datapackage+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dataresource+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dbf": {
			"source": "iana",
			"extensions": ["dbf"]
		},
		"application/vnd.debian.binary-package": { "source": "iana" },
		"application/vnd.dece.data": {
			"source": "iana",
			"extensions": [
				"uvf",
				"uvvf",
				"uvd",
				"uvvd"
			]
		},
		"application/vnd.dece.ttml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["uvt", "uvvt"]
		},
		"application/vnd.dece.unspecified": {
			"source": "iana",
			"extensions": ["uvx", "uvvx"]
		},
		"application/vnd.dece.zip": {
			"source": "iana",
			"extensions": ["uvz", "uvvz"]
		},
		"application/vnd.denovo.fcselayout-link": {
			"source": "iana",
			"extensions": ["fe_launch"]
		},
		"application/vnd.desmume.movie": { "source": "iana" },
		"application/vnd.dir-bi.plate-dl-nosuffix": { "source": "iana" },
		"application/vnd.dm.delegation+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dna": {
			"source": "iana",
			"extensions": ["dna"]
		},
		"application/vnd.document+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dolby.mlp": {
			"source": "apache",
			"extensions": ["mlp"]
		},
		"application/vnd.dolby.mobile.1": { "source": "iana" },
		"application/vnd.dolby.mobile.2": { "source": "iana" },
		"application/vnd.doremir.scorecloud-binary-document": { "source": "iana" },
		"application/vnd.dpgraph": {
			"source": "iana",
			"extensions": ["dpg"]
		},
		"application/vnd.dreamfactory": {
			"source": "iana",
			"extensions": ["dfac"]
		},
		"application/vnd.drive+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ds-keypoint": {
			"source": "apache",
			"extensions": ["kpxx"]
		},
		"application/vnd.dtg.local": { "source": "iana" },
		"application/vnd.dtg.local.flash": { "source": "iana" },
		"application/vnd.dtg.local.html": { "source": "iana" },
		"application/vnd.dvb.ait": {
			"source": "iana",
			"extensions": ["ait"]
		},
		"application/vnd.dvb.dvbisl+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.dvbj": { "source": "iana" },
		"application/vnd.dvb.esgcontainer": { "source": "iana" },
		"application/vnd.dvb.ipdcdftnotifaccess": { "source": "iana" },
		"application/vnd.dvb.ipdcesgaccess": { "source": "iana" },
		"application/vnd.dvb.ipdcesgaccess2": { "source": "iana" },
		"application/vnd.dvb.ipdcesgpdd": { "source": "iana" },
		"application/vnd.dvb.ipdcroaming": { "source": "iana" },
		"application/vnd.dvb.iptv.alfec-base": { "source": "iana" },
		"application/vnd.dvb.iptv.alfec-enhancement": { "source": "iana" },
		"application/vnd.dvb.notif-aggregate-root+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.notif-container+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.notif-generic+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.notif-ia-msglist+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.notif-ia-registration-request+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.notif-ia-registration-response+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.notif-init+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.dvb.pfr": { "source": "iana" },
		"application/vnd.dvb.service": {
			"source": "iana",
			"extensions": ["svc"]
		},
		"application/vnd.dxr": { "source": "iana" },
		"application/vnd.dynageo": {
			"source": "iana",
			"extensions": ["geo"]
		},
		"application/vnd.dzr": { "source": "iana" },
		"application/vnd.easykaraoke.cdgdownload": { "source": "iana" },
		"application/vnd.ecdis-update": { "source": "iana" },
		"application/vnd.ecip.rlp": { "source": "iana" },
		"application/vnd.eclipse.ditto+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ecowin.chart": {
			"source": "iana",
			"extensions": ["mag"]
		},
		"application/vnd.ecowin.filerequest": { "source": "iana" },
		"application/vnd.ecowin.fileupdate": { "source": "iana" },
		"application/vnd.ecowin.series": { "source": "iana" },
		"application/vnd.ecowin.seriesrequest": { "source": "iana" },
		"application/vnd.ecowin.seriesupdate": { "source": "iana" },
		"application/vnd.efi.img": { "source": "iana" },
		"application/vnd.efi.iso": { "source": "iana" },
		"application/vnd.emclient.accessrequest+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.enliven": {
			"source": "iana",
			"extensions": ["nml"]
		},
		"application/vnd.enphase.envoy": { "source": "iana" },
		"application/vnd.eprints.data+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.epson.esf": {
			"source": "iana",
			"extensions": ["esf"]
		},
		"application/vnd.epson.msf": {
			"source": "iana",
			"extensions": ["msf"]
		},
		"application/vnd.epson.quickanime": {
			"source": "iana",
			"extensions": ["qam"]
		},
		"application/vnd.epson.salt": {
			"source": "iana",
			"extensions": ["slt"]
		},
		"application/vnd.epson.ssf": {
			"source": "iana",
			"extensions": ["ssf"]
		},
		"application/vnd.ericsson.quickcall": { "source": "iana" },
		"application/vnd.espass-espass+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.eszigno3+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["es3", "et3"]
		},
		"application/vnd.etsi.aoc+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.asic-e+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.etsi.asic-s+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.etsi.cug+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvcommand+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvdiscovery+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvprofile+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvsad-bc+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvsad-cod+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvsad-npvr+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvservice+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvsync+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.iptvueprofile+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.mcid+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.mheg5": { "source": "iana" },
		"application/vnd.etsi.overload-control-policy-dataset+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.pstn+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.sci+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.simservs+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.timestamp-token": { "source": "iana" },
		"application/vnd.etsi.tsl+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.etsi.tsl.der": { "source": "iana" },
		"application/vnd.eu.kasparian.car+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.eudora.data": { "source": "iana" },
		"application/vnd.evolv.ecig.profile": { "source": "iana" },
		"application/vnd.evolv.ecig.settings": { "source": "iana" },
		"application/vnd.evolv.ecig.theme": { "source": "iana" },
		"application/vnd.exstream-empower+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.exstream-package": { "source": "iana" },
		"application/vnd.ezpix-album": {
			"source": "iana",
			"extensions": ["ez2"]
		},
		"application/vnd.ezpix-package": {
			"source": "iana",
			"extensions": ["ez3"]
		},
		"application/vnd.f-secure.mobile": { "source": "iana" },
		"application/vnd.familysearch.gedcom+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.fastcopy-disk-image": { "source": "iana" },
		"application/vnd.fdf": {
			"source": "iana",
			"extensions": ["fdf"]
		},
		"application/vnd.fdsn.mseed": {
			"source": "iana",
			"extensions": ["mseed"]
		},
		"application/vnd.fdsn.seed": {
			"source": "iana",
			"extensions": ["seed", "dataless"]
		},
		"application/vnd.ffsns": { "source": "iana" },
		"application/vnd.ficlab.flb+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.filmit.zfc": { "source": "iana" },
		"application/vnd.fints": { "source": "iana" },
		"application/vnd.firemonkeys.cloudcell": { "source": "iana" },
		"application/vnd.flographit": {
			"source": "iana",
			"extensions": ["gph"]
		},
		"application/vnd.fluxtime.clip": {
			"source": "iana",
			"extensions": ["ftc"]
		},
		"application/vnd.font-fontforge-sfd": { "source": "iana" },
		"application/vnd.framemaker": {
			"source": "iana",
			"extensions": [
				"fm",
				"frame",
				"maker",
				"book"
			]
		},
		"application/vnd.frogans.fnc": {
			"source": "iana",
			"extensions": ["fnc"]
		},
		"application/vnd.frogans.ltf": {
			"source": "iana",
			"extensions": ["ltf"]
		},
		"application/vnd.fsc.weblaunch": {
			"source": "iana",
			"extensions": ["fsc"]
		},
		"application/vnd.fujifilm.fb.docuworks": { "source": "iana" },
		"application/vnd.fujifilm.fb.docuworks.binder": { "source": "iana" },
		"application/vnd.fujifilm.fb.docuworks.container": { "source": "iana" },
		"application/vnd.fujifilm.fb.jfi+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.fujitsu.oasys": {
			"source": "iana",
			"extensions": ["oas"]
		},
		"application/vnd.fujitsu.oasys2": {
			"source": "iana",
			"extensions": ["oa2"]
		},
		"application/vnd.fujitsu.oasys3": {
			"source": "iana",
			"extensions": ["oa3"]
		},
		"application/vnd.fujitsu.oasysgp": {
			"source": "iana",
			"extensions": ["fg5"]
		},
		"application/vnd.fujitsu.oasysprs": {
			"source": "iana",
			"extensions": ["bh2"]
		},
		"application/vnd.fujixerox.art-ex": { "source": "iana" },
		"application/vnd.fujixerox.art4": { "source": "iana" },
		"application/vnd.fujixerox.ddd": {
			"source": "iana",
			"extensions": ["ddd"]
		},
		"application/vnd.fujixerox.docuworks": {
			"source": "iana",
			"extensions": ["xdw"]
		},
		"application/vnd.fujixerox.docuworks.binder": {
			"source": "iana",
			"extensions": ["xbd"]
		},
		"application/vnd.fujixerox.docuworks.container": { "source": "iana" },
		"application/vnd.fujixerox.hbpl": { "source": "iana" },
		"application/vnd.fut-misnet": { "source": "iana" },
		"application/vnd.futoin+cbor": { "source": "iana" },
		"application/vnd.futoin+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.fuzzysheet": {
			"source": "iana",
			"extensions": ["fzs"]
		},
		"application/vnd.genomatix.tuxedo": {
			"source": "iana",
			"extensions": ["txd"]
		},
		"application/vnd.gentics.grd+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.geo+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.geocube+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.geogebra.file": {
			"source": "iana",
			"extensions": ["ggb"]
		},
		"application/vnd.geogebra.slides": { "source": "iana" },
		"application/vnd.geogebra.tool": {
			"source": "iana",
			"extensions": ["ggt"]
		},
		"application/vnd.geometry-explorer": {
			"source": "iana",
			"extensions": ["gex", "gre"]
		},
		"application/vnd.geonext": {
			"source": "iana",
			"extensions": ["gxt"]
		},
		"application/vnd.geoplan": {
			"source": "iana",
			"extensions": ["g2w"]
		},
		"application/vnd.geospace": {
			"source": "iana",
			"extensions": ["g3w"]
		},
		"application/vnd.gerber": { "source": "iana" },
		"application/vnd.globalplatform.card-content-mgt": { "source": "iana" },
		"application/vnd.globalplatform.card-content-mgt-response": { "source": "iana" },
		"application/vnd.gmx": {
			"source": "iana",
			"extensions": ["gmx"]
		},
		"application/vnd.google-apps.document": {
			"compressible": false,
			"extensions": ["gdoc"]
		},
		"application/vnd.google-apps.presentation": {
			"compressible": false,
			"extensions": ["gslides"]
		},
		"application/vnd.google-apps.spreadsheet": {
			"compressible": false,
			"extensions": ["gsheet"]
		},
		"application/vnd.google-earth.kml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["kml"]
		},
		"application/vnd.google-earth.kmz": {
			"source": "iana",
			"compressible": false,
			"extensions": ["kmz"]
		},
		"application/vnd.gov.sk.e-form+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.gov.sk.e-form+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.gov.sk.xmldatacontainer+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.grafeq": {
			"source": "iana",
			"extensions": ["gqf", "gqs"]
		},
		"application/vnd.gridmp": { "source": "iana" },
		"application/vnd.groove-account": {
			"source": "iana",
			"extensions": ["gac"]
		},
		"application/vnd.groove-help": {
			"source": "iana",
			"extensions": ["ghf"]
		},
		"application/vnd.groove-identity-message": {
			"source": "iana",
			"extensions": ["gim"]
		},
		"application/vnd.groove-injector": {
			"source": "iana",
			"extensions": ["grv"]
		},
		"application/vnd.groove-tool-message": {
			"source": "iana",
			"extensions": ["gtm"]
		},
		"application/vnd.groove-tool-template": {
			"source": "iana",
			"extensions": ["tpl"]
		},
		"application/vnd.groove-vcard": {
			"source": "iana",
			"extensions": ["vcg"]
		},
		"application/vnd.hal+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.hal+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["hal"]
		},
		"application/vnd.handheld-entertainment+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["zmm"]
		},
		"application/vnd.hbci": {
			"source": "iana",
			"extensions": ["hbci"]
		},
		"application/vnd.hc+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.hcl-bireports": { "source": "iana" },
		"application/vnd.hdt": { "source": "iana" },
		"application/vnd.heroku+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.hhe.lesson-player": {
			"source": "iana",
			"extensions": ["les"]
		},
		"application/vnd.hl7cda+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/vnd.hl7v2+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/vnd.hp-hpgl": {
			"source": "iana",
			"extensions": ["hpgl"]
		},
		"application/vnd.hp-hpid": {
			"source": "iana",
			"extensions": ["hpid"]
		},
		"application/vnd.hp-hps": {
			"source": "iana",
			"extensions": ["hps"]
		},
		"application/vnd.hp-jlyt": {
			"source": "iana",
			"extensions": ["jlt"]
		},
		"application/vnd.hp-pcl": {
			"source": "iana",
			"extensions": ["pcl"]
		},
		"application/vnd.hp-pclxl": {
			"source": "iana",
			"extensions": ["pclxl"]
		},
		"application/vnd.httphone": { "source": "iana" },
		"application/vnd.hydrostatix.sof-data": {
			"source": "iana",
			"extensions": ["sfd-hdstx"]
		},
		"application/vnd.hyper+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.hyper-item+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.hyperdrive+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.hzn-3d-crossword": { "source": "iana" },
		"application/vnd.ibm.afplinedata": { "source": "iana" },
		"application/vnd.ibm.electronic-media": { "source": "iana" },
		"application/vnd.ibm.minipay": {
			"source": "iana",
			"extensions": ["mpy"]
		},
		"application/vnd.ibm.modcap": {
			"source": "iana",
			"extensions": [
				"afp",
				"listafp",
				"list3820"
			]
		},
		"application/vnd.ibm.rights-management": {
			"source": "iana",
			"extensions": ["irm"]
		},
		"application/vnd.ibm.secure-container": {
			"source": "iana",
			"extensions": ["sc"]
		},
		"application/vnd.iccprofile": {
			"source": "iana",
			"extensions": ["icc", "icm"]
		},
		"application/vnd.ieee.1905": { "source": "iana" },
		"application/vnd.igloader": {
			"source": "iana",
			"extensions": ["igl"]
		},
		"application/vnd.imagemeter.folder+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.imagemeter.image+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.immervision-ivp": {
			"source": "iana",
			"extensions": ["ivp"]
		},
		"application/vnd.immervision-ivu": {
			"source": "iana",
			"extensions": ["ivu"]
		},
		"application/vnd.ims.imsccv1p1": { "source": "iana" },
		"application/vnd.ims.imsccv1p2": { "source": "iana" },
		"application/vnd.ims.imsccv1p3": { "source": "iana" },
		"application/vnd.ims.lis.v2.result+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ims.lti.v2.toolconsumerprofile+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ims.lti.v2.toolproxy+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ims.lti.v2.toolproxy.id+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ims.lti.v2.toolsettings+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ims.lti.v2.toolsettings.simple+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.informedcontrol.rms+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.informix-visionary": { "source": "iana" },
		"application/vnd.infotech.project": { "source": "iana" },
		"application/vnd.infotech.project+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.innopath.wamp.notification": { "source": "iana" },
		"application/vnd.insors.igm": {
			"source": "iana",
			"extensions": ["igm"]
		},
		"application/vnd.intercon.formnet": {
			"source": "iana",
			"extensions": ["xpw", "xpx"]
		},
		"application/vnd.intergeo": {
			"source": "iana",
			"extensions": ["i2g"]
		},
		"application/vnd.intertrust.digibox": { "source": "iana" },
		"application/vnd.intertrust.nncp": { "source": "iana" },
		"application/vnd.intu.qbo": {
			"source": "iana",
			"extensions": ["qbo"]
		},
		"application/vnd.intu.qfx": {
			"source": "iana",
			"extensions": ["qfx"]
		},
		"application/vnd.iptc.g2.catalogitem+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.iptc.g2.conceptitem+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.iptc.g2.knowledgeitem+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.iptc.g2.newsitem+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.iptc.g2.newsmessage+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.iptc.g2.packageitem+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.iptc.g2.planningitem+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ipunplugged.rcprofile": {
			"source": "iana",
			"extensions": ["rcprofile"]
		},
		"application/vnd.irepository.package+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["irp"]
		},
		"application/vnd.is-xpr": {
			"source": "iana",
			"extensions": ["xpr"]
		},
		"application/vnd.isac.fcs": {
			"source": "iana",
			"extensions": ["fcs"]
		},
		"application/vnd.iso11783-10+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.jam": {
			"source": "iana",
			"extensions": ["jam"]
		},
		"application/vnd.japannet-directory-service": { "source": "iana" },
		"application/vnd.japannet-jpnstore-wakeup": { "source": "iana" },
		"application/vnd.japannet-payment-wakeup": { "source": "iana" },
		"application/vnd.japannet-registration": { "source": "iana" },
		"application/vnd.japannet-registration-wakeup": { "source": "iana" },
		"application/vnd.japannet-setstore-wakeup": { "source": "iana" },
		"application/vnd.japannet-verification": { "source": "iana" },
		"application/vnd.japannet-verification-wakeup": { "source": "iana" },
		"application/vnd.jcp.javame.midlet-rms": {
			"source": "iana",
			"extensions": ["rms"]
		},
		"application/vnd.jisp": {
			"source": "iana",
			"extensions": ["jisp"]
		},
		"application/vnd.joost.joda-archive": {
			"source": "iana",
			"extensions": ["joda"]
		},
		"application/vnd.jsk.isdn-ngn": { "source": "iana" },
		"application/vnd.kahootz": {
			"source": "iana",
			"extensions": ["ktz", "ktr"]
		},
		"application/vnd.kde.karbon": {
			"source": "iana",
			"extensions": ["karbon"]
		},
		"application/vnd.kde.kchart": {
			"source": "iana",
			"extensions": ["chrt"]
		},
		"application/vnd.kde.kformula": {
			"source": "iana",
			"extensions": ["kfo"]
		},
		"application/vnd.kde.kivio": {
			"source": "iana",
			"extensions": ["flw"]
		},
		"application/vnd.kde.kontour": {
			"source": "iana",
			"extensions": ["kon"]
		},
		"application/vnd.kde.kpresenter": {
			"source": "iana",
			"extensions": ["kpr", "kpt"]
		},
		"application/vnd.kde.kspread": {
			"source": "iana",
			"extensions": ["ksp"]
		},
		"application/vnd.kde.kword": {
			"source": "iana",
			"extensions": ["kwd", "kwt"]
		},
		"application/vnd.kenameaapp": {
			"source": "iana",
			"extensions": ["htke"]
		},
		"application/vnd.kidspiration": {
			"source": "iana",
			"extensions": ["kia"]
		},
		"application/vnd.kinar": {
			"source": "iana",
			"extensions": ["kne", "knp"]
		},
		"application/vnd.koan": {
			"source": "iana",
			"extensions": [
				"skp",
				"skd",
				"skt",
				"skm"
			]
		},
		"application/vnd.kodak-descriptor": {
			"source": "iana",
			"extensions": ["sse"]
		},
		"application/vnd.las": { "source": "iana" },
		"application/vnd.las.las+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.las.las+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["lasxml"]
		},
		"application/vnd.laszip": { "source": "iana" },
		"application/vnd.leap+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.liberty-request+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.llamagraphics.life-balance.desktop": {
			"source": "iana",
			"extensions": ["lbd"]
		},
		"application/vnd.llamagraphics.life-balance.exchange+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["lbe"]
		},
		"application/vnd.logipipe.circuit+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.loom": { "source": "iana" },
		"application/vnd.lotus-1-2-3": {
			"source": "iana",
			"extensions": ["123"]
		},
		"application/vnd.lotus-approach": {
			"source": "iana",
			"extensions": ["apr"]
		},
		"application/vnd.lotus-freelance": {
			"source": "iana",
			"extensions": ["pre"]
		},
		"application/vnd.lotus-notes": {
			"source": "iana",
			"extensions": ["nsf"]
		},
		"application/vnd.lotus-organizer": {
			"source": "iana",
			"extensions": ["org"]
		},
		"application/vnd.lotus-screencam": {
			"source": "iana",
			"extensions": ["scm"]
		},
		"application/vnd.lotus-wordpro": {
			"source": "iana",
			"extensions": ["lwp"]
		},
		"application/vnd.macports.portpkg": {
			"source": "iana",
			"extensions": ["portpkg"]
		},
		"application/vnd.mapbox-vector-tile": {
			"source": "iana",
			"extensions": ["mvt"]
		},
		"application/vnd.marlin.drm.actiontoken+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.marlin.drm.conftoken+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.marlin.drm.license+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.marlin.drm.mdcf": { "source": "iana" },
		"application/vnd.mason+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.maxar.archive.3tz+zip": {
			"source": "iana",
			"compressible": false
		},
		"application/vnd.maxmind.maxmind-db": { "source": "iana" },
		"application/vnd.mcd": {
			"source": "iana",
			"extensions": ["mcd"]
		},
		"application/vnd.medcalcdata": {
			"source": "iana",
			"extensions": ["mc1"]
		},
		"application/vnd.mediastation.cdkey": {
			"source": "iana",
			"extensions": ["cdkey"]
		},
		"application/vnd.meridian-slingshot": { "source": "iana" },
		"application/vnd.mfer": {
			"source": "iana",
			"extensions": ["mwf"]
		},
		"application/vnd.mfmp": {
			"source": "iana",
			"extensions": ["mfm"]
		},
		"application/vnd.micro+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.micrografx.flo": {
			"source": "iana",
			"extensions": ["flo"]
		},
		"application/vnd.micrografx.igx": {
			"source": "iana",
			"extensions": ["igx"]
		},
		"application/vnd.microsoft.portable-executable": { "source": "iana" },
		"application/vnd.microsoft.windows.thumbnail-cache": { "source": "iana" },
		"application/vnd.miele+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.mif": {
			"source": "iana",
			"extensions": ["mif"]
		},
		"application/vnd.minisoft-hp3000-save": { "source": "iana" },
		"application/vnd.mitsubishi.misty-guard.trustweb": { "source": "iana" },
		"application/vnd.mobius.daf": {
			"source": "iana",
			"extensions": ["daf"]
		},
		"application/vnd.mobius.dis": {
			"source": "iana",
			"extensions": ["dis"]
		},
		"application/vnd.mobius.mbk": {
			"source": "iana",
			"extensions": ["mbk"]
		},
		"application/vnd.mobius.mqy": {
			"source": "iana",
			"extensions": ["mqy"]
		},
		"application/vnd.mobius.msl": {
			"source": "iana",
			"extensions": ["msl"]
		},
		"application/vnd.mobius.plc": {
			"source": "iana",
			"extensions": ["plc"]
		},
		"application/vnd.mobius.txf": {
			"source": "iana",
			"extensions": ["txf"]
		},
		"application/vnd.mophun.application": {
			"source": "iana",
			"extensions": ["mpn"]
		},
		"application/vnd.mophun.certificate": {
			"source": "iana",
			"extensions": ["mpc"]
		},
		"application/vnd.motorola.flexsuite": { "source": "iana" },
		"application/vnd.motorola.flexsuite.adsi": { "source": "iana" },
		"application/vnd.motorola.flexsuite.fis": { "source": "iana" },
		"application/vnd.motorola.flexsuite.gotap": { "source": "iana" },
		"application/vnd.motorola.flexsuite.kmr": { "source": "iana" },
		"application/vnd.motorola.flexsuite.ttc": { "source": "iana" },
		"application/vnd.motorola.flexsuite.wem": { "source": "iana" },
		"application/vnd.motorola.iprm": { "source": "iana" },
		"application/vnd.mozilla.xul+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xul"]
		},
		"application/vnd.ms-3mfdocument": { "source": "iana" },
		"application/vnd.ms-artgalry": {
			"source": "iana",
			"extensions": ["cil"]
		},
		"application/vnd.ms-asf": { "source": "iana" },
		"application/vnd.ms-cab-compressed": {
			"source": "iana",
			"extensions": ["cab"]
		},
		"application/vnd.ms-color.iccprofile": { "source": "apache" },
		"application/vnd.ms-excel": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"xls",
				"xlm",
				"xla",
				"xlc",
				"xlt",
				"xlw"
			]
		},
		"application/vnd.ms-excel.addin.macroenabled.12": {
			"source": "iana",
			"extensions": ["xlam"]
		},
		"application/vnd.ms-excel.sheet.binary.macroenabled.12": {
			"source": "iana",
			"extensions": ["xlsb"]
		},
		"application/vnd.ms-excel.sheet.macroenabled.12": {
			"source": "iana",
			"extensions": ["xlsm"]
		},
		"application/vnd.ms-excel.template.macroenabled.12": {
			"source": "iana",
			"extensions": ["xltm"]
		},
		"application/vnd.ms-fontobject": {
			"source": "iana",
			"compressible": true,
			"extensions": ["eot"]
		},
		"application/vnd.ms-htmlhelp": {
			"source": "iana",
			"extensions": ["chm"]
		},
		"application/vnd.ms-ims": {
			"source": "iana",
			"extensions": ["ims"]
		},
		"application/vnd.ms-lrm": {
			"source": "iana",
			"extensions": ["lrm"]
		},
		"application/vnd.ms-office.activex+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ms-officetheme": {
			"source": "iana",
			"extensions": ["thmx"]
		},
		"application/vnd.ms-opentype": {
			"source": "apache",
			"compressible": true
		},
		"application/vnd.ms-outlook": {
			"compressible": false,
			"extensions": ["msg"]
		},
		"application/vnd.ms-package.obfuscated-opentype": { "source": "apache" },
		"application/vnd.ms-pki.seccat": {
			"source": "apache",
			"extensions": ["cat"]
		},
		"application/vnd.ms-pki.stl": {
			"source": "apache",
			"extensions": ["stl"]
		},
		"application/vnd.ms-playready.initiator+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ms-powerpoint": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"ppt",
				"pps",
				"pot"
			]
		},
		"application/vnd.ms-powerpoint.addin.macroenabled.12": {
			"source": "iana",
			"extensions": ["ppam"]
		},
		"application/vnd.ms-powerpoint.presentation.macroenabled.12": {
			"source": "iana",
			"extensions": ["pptm"]
		},
		"application/vnd.ms-powerpoint.slide.macroenabled.12": {
			"source": "iana",
			"extensions": ["sldm"]
		},
		"application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
			"source": "iana",
			"extensions": ["ppsm"]
		},
		"application/vnd.ms-powerpoint.template.macroenabled.12": {
			"source": "iana",
			"extensions": ["potm"]
		},
		"application/vnd.ms-printdevicecapabilities+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ms-printing.printticket+xml": {
			"source": "apache",
			"compressible": true
		},
		"application/vnd.ms-printschematicket+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ms-project": {
			"source": "iana",
			"extensions": ["mpp", "mpt"]
		},
		"application/vnd.ms-tnef": { "source": "iana" },
		"application/vnd.ms-windows.devicepairing": { "source": "iana" },
		"application/vnd.ms-windows.nwprinting.oob": { "source": "iana" },
		"application/vnd.ms-windows.printerpairing": { "source": "iana" },
		"application/vnd.ms-windows.wsd.oob": { "source": "iana" },
		"application/vnd.ms-wmdrm.lic-chlg-req": { "source": "iana" },
		"application/vnd.ms-wmdrm.lic-resp": { "source": "iana" },
		"application/vnd.ms-wmdrm.meter-chlg-req": { "source": "iana" },
		"application/vnd.ms-wmdrm.meter-resp": { "source": "iana" },
		"application/vnd.ms-word.document.macroenabled.12": {
			"source": "iana",
			"extensions": ["docm"]
		},
		"application/vnd.ms-word.template.macroenabled.12": {
			"source": "iana",
			"extensions": ["dotm"]
		},
		"application/vnd.ms-works": {
			"source": "iana",
			"extensions": [
				"wps",
				"wks",
				"wcm",
				"wdb"
			]
		},
		"application/vnd.ms-wpl": {
			"source": "iana",
			"extensions": ["wpl"]
		},
		"application/vnd.ms-xpsdocument": {
			"source": "iana",
			"compressible": false,
			"extensions": ["xps"]
		},
		"application/vnd.msa-disk-image": { "source": "iana" },
		"application/vnd.mseq": {
			"source": "iana",
			"extensions": ["mseq"]
		},
		"application/vnd.msign": { "source": "iana" },
		"application/vnd.multiad.creator": { "source": "iana" },
		"application/vnd.multiad.creator.cif": { "source": "iana" },
		"application/vnd.music-niff": { "source": "iana" },
		"application/vnd.musician": {
			"source": "iana",
			"extensions": ["mus"]
		},
		"application/vnd.muvee.style": {
			"source": "iana",
			"extensions": ["msty"]
		},
		"application/vnd.mynfc": {
			"source": "iana",
			"extensions": ["taglet"]
		},
		"application/vnd.nacamar.ybrid+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.ncd.control": { "source": "iana" },
		"application/vnd.ncd.reference": { "source": "iana" },
		"application/vnd.nearst.inv+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.nebumind.line": { "source": "iana" },
		"application/vnd.nervana": { "source": "iana" },
		"application/vnd.netfpx": { "source": "iana" },
		"application/vnd.neurolanguage.nlu": {
			"source": "iana",
			"extensions": ["nlu"]
		},
		"application/vnd.nimn": { "source": "iana" },
		"application/vnd.nintendo.nitro.rom": { "source": "iana" },
		"application/vnd.nintendo.snes.rom": { "source": "iana" },
		"application/vnd.nitf": {
			"source": "iana",
			"extensions": ["ntf", "nitf"]
		},
		"application/vnd.noblenet-directory": {
			"source": "iana",
			"extensions": ["nnd"]
		},
		"application/vnd.noblenet-sealer": {
			"source": "iana",
			"extensions": ["nns"]
		},
		"application/vnd.noblenet-web": {
			"source": "iana",
			"extensions": ["nnw"]
		},
		"application/vnd.nokia.catalogs": { "source": "iana" },
		"application/vnd.nokia.conml+wbxml": { "source": "iana" },
		"application/vnd.nokia.conml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.nokia.iptv.config+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.nokia.isds-radio-presets": { "source": "iana" },
		"application/vnd.nokia.landmark+wbxml": { "source": "iana" },
		"application/vnd.nokia.landmark+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.nokia.landmarkcollection+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.nokia.n-gage.ac+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["ac"]
		},
		"application/vnd.nokia.n-gage.data": {
			"source": "iana",
			"extensions": ["ngdat"]
		},
		"application/vnd.nokia.n-gage.symbian.install": {
			"source": "iana",
			"extensions": ["n-gage"]
		},
		"application/vnd.nokia.ncd": { "source": "iana" },
		"application/vnd.nokia.pcd+wbxml": { "source": "iana" },
		"application/vnd.nokia.pcd+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.nokia.radio-preset": {
			"source": "iana",
			"extensions": ["rpst"]
		},
		"application/vnd.nokia.radio-presets": {
			"source": "iana",
			"extensions": ["rpss"]
		},
		"application/vnd.novadigm.edm": {
			"source": "iana",
			"extensions": ["edm"]
		},
		"application/vnd.novadigm.edx": {
			"source": "iana",
			"extensions": ["edx"]
		},
		"application/vnd.novadigm.ext": {
			"source": "iana",
			"extensions": ["ext"]
		},
		"application/vnd.ntt-local.content-share": { "source": "iana" },
		"application/vnd.ntt-local.file-transfer": { "source": "iana" },
		"application/vnd.ntt-local.ogw_remote-access": { "source": "iana" },
		"application/vnd.ntt-local.sip-ta_remote": { "source": "iana" },
		"application/vnd.ntt-local.sip-ta_tcp_stream": { "source": "iana" },
		"application/vnd.oasis.opendocument.chart": {
			"source": "iana",
			"extensions": ["odc"]
		},
		"application/vnd.oasis.opendocument.chart-template": {
			"source": "iana",
			"extensions": ["otc"]
		},
		"application/vnd.oasis.opendocument.database": {
			"source": "iana",
			"extensions": ["odb"]
		},
		"application/vnd.oasis.opendocument.formula": {
			"source": "iana",
			"extensions": ["odf"]
		},
		"application/vnd.oasis.opendocument.formula-template": {
			"source": "iana",
			"extensions": ["odft"]
		},
		"application/vnd.oasis.opendocument.graphics": {
			"source": "iana",
			"compressible": false,
			"extensions": ["odg"]
		},
		"application/vnd.oasis.opendocument.graphics-template": {
			"source": "iana",
			"extensions": ["otg"]
		},
		"application/vnd.oasis.opendocument.image": {
			"source": "iana",
			"extensions": ["odi"]
		},
		"application/vnd.oasis.opendocument.image-template": {
			"source": "iana",
			"extensions": ["oti"]
		},
		"application/vnd.oasis.opendocument.presentation": {
			"source": "iana",
			"compressible": false,
			"extensions": ["odp"]
		},
		"application/vnd.oasis.opendocument.presentation-template": {
			"source": "iana",
			"extensions": ["otp"]
		},
		"application/vnd.oasis.opendocument.spreadsheet": {
			"source": "iana",
			"compressible": false,
			"extensions": ["ods"]
		},
		"application/vnd.oasis.opendocument.spreadsheet-template": {
			"source": "iana",
			"extensions": ["ots"]
		},
		"application/vnd.oasis.opendocument.text": {
			"source": "iana",
			"compressible": false,
			"extensions": ["odt"]
		},
		"application/vnd.oasis.opendocument.text-master": {
			"source": "iana",
			"extensions": ["odm"]
		},
		"application/vnd.oasis.opendocument.text-template": {
			"source": "iana",
			"extensions": ["ott"]
		},
		"application/vnd.oasis.opendocument.text-web": {
			"source": "iana",
			"extensions": ["oth"]
		},
		"application/vnd.obn": { "source": "iana" },
		"application/vnd.ocf+cbor": { "source": "iana" },
		"application/vnd.oci.image.manifest.v1+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oftn.l10n+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.contentaccessdownload+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.contentaccessstreaming+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.cspg-hexbinary": { "source": "iana" },
		"application/vnd.oipf.dae.svg+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.dae.xhtml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.mippvcontrolmessage+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.pae.gem": { "source": "iana" },
		"application/vnd.oipf.spdiscovery+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.spdlist+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.ueprofile+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oipf.userprofile+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.olpc-sugar": {
			"source": "iana",
			"extensions": ["xo"]
		},
		"application/vnd.oma-scws-config": { "source": "iana" },
		"application/vnd.oma-scws-http-request": { "source": "iana" },
		"application/vnd.oma-scws-http-response": { "source": "iana" },
		"application/vnd.oma.bcast.associated-procedure-parameter+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.bcast.drm-trigger+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.bcast.imd+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.bcast.ltkm": { "source": "iana" },
		"application/vnd.oma.bcast.notification+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.bcast.provisioningtrigger": { "source": "iana" },
		"application/vnd.oma.bcast.sgboot": { "source": "iana" },
		"application/vnd.oma.bcast.sgdd+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.bcast.sgdu": { "source": "iana" },
		"application/vnd.oma.bcast.simple-symbol-container": { "source": "iana" },
		"application/vnd.oma.bcast.smartcard-trigger+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.bcast.sprov+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.bcast.stkm": { "source": "iana" },
		"application/vnd.oma.cab-address-book+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.cab-feature-handler+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.cab-pcc+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.cab-subs-invite+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.cab-user-prefs+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.dcd": { "source": "iana" },
		"application/vnd.oma.dcdc": { "source": "iana" },
		"application/vnd.oma.dd2+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["dd2"]
		},
		"application/vnd.oma.drm.risd+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.group-usage-list+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.lwm2m+cbor": { "source": "iana" },
		"application/vnd.oma.lwm2m+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.lwm2m+tlv": { "source": "iana" },
		"application/vnd.oma.pal+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.poc.detailed-progress-report+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.poc.final-report+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.poc.groups+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.poc.invocation-descriptor+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.poc.optimized-progress-report+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.push": { "source": "iana" },
		"application/vnd.oma.scidm.messages+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oma.xcap-directory+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.omads-email+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/vnd.omads-file+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/vnd.omads-folder+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/vnd.omaloc-supl-init": { "source": "iana" },
		"application/vnd.onepager": { "source": "iana" },
		"application/vnd.onepagertamp": { "source": "iana" },
		"application/vnd.onepagertamx": { "source": "iana" },
		"application/vnd.onepagertat": { "source": "iana" },
		"application/vnd.onepagertatp": { "source": "iana" },
		"application/vnd.onepagertatx": { "source": "iana" },
		"application/vnd.openblox.game+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["obgx"]
		},
		"application/vnd.openblox.game-binary": { "source": "iana" },
		"application/vnd.openeye.oeb": { "source": "iana" },
		"application/vnd.openofficeorg.extension": {
			"source": "apache",
			"extensions": ["oxt"]
		},
		"application/vnd.openstreetmap.data+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["osm"]
		},
		"application/vnd.opentimestamps.ots": { "source": "iana" },
		"application/vnd.openxmlformats-officedocument.custom-properties+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.drawing+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.extended-properties+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": {
			"source": "iana",
			"compressible": false,
			"extensions": ["pptx"]
		},
		"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.slide": {
			"source": "iana",
			"extensions": ["sldx"]
		},
		"application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
			"source": "iana",
			"extensions": ["ppsx"]
		},
		"application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.template": {
			"source": "iana",
			"extensions": ["potx"]
		},
		"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
			"source": "iana",
			"compressible": false,
			"extensions": ["xlsx"]
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
			"source": "iana",
			"extensions": ["xltx"]
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.theme+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.themeoverride+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.vmldrawing": { "source": "iana" },
		"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
			"source": "iana",
			"compressible": false,
			"extensions": ["docx"]
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
			"source": "iana",
			"extensions": ["dotx"]
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-package.core-properties+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.openxmlformats-package.relationships+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oracle.resource+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.orange.indata": { "source": "iana" },
		"application/vnd.osa.netdeploy": { "source": "iana" },
		"application/vnd.osgeo.mapguide.package": {
			"source": "iana",
			"extensions": ["mgp"]
		},
		"application/vnd.osgi.bundle": { "source": "iana" },
		"application/vnd.osgi.dp": {
			"source": "iana",
			"extensions": ["dp"]
		},
		"application/vnd.osgi.subsystem": {
			"source": "iana",
			"extensions": ["esa"]
		},
		"application/vnd.otps.ct-kip+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.oxli.countgraph": { "source": "iana" },
		"application/vnd.pagerduty+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.palm": {
			"source": "iana",
			"extensions": [
				"pdb",
				"pqa",
				"oprc"
			]
		},
		"application/vnd.panoply": { "source": "iana" },
		"application/vnd.paos.xml": { "source": "iana" },
		"application/vnd.patentdive": { "source": "iana" },
		"application/vnd.patientecommsdoc": { "source": "iana" },
		"application/vnd.pawaafile": {
			"source": "iana",
			"extensions": ["paw"]
		},
		"application/vnd.pcos": { "source": "iana" },
		"application/vnd.pg.format": {
			"source": "iana",
			"extensions": ["str"]
		},
		"application/vnd.pg.osasli": {
			"source": "iana",
			"extensions": ["ei6"]
		},
		"application/vnd.piaccess.application-licence": { "source": "iana" },
		"application/vnd.picsel": {
			"source": "iana",
			"extensions": ["efif"]
		},
		"application/vnd.pmi.widget": {
			"source": "iana",
			"extensions": ["wg"]
		},
		"application/vnd.poc.group-advertisement+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.pocketlearn": {
			"source": "iana",
			"extensions": ["plf"]
		},
		"application/vnd.powerbuilder6": {
			"source": "iana",
			"extensions": ["pbd"]
		},
		"application/vnd.powerbuilder6-s": { "source": "iana" },
		"application/vnd.powerbuilder7": { "source": "iana" },
		"application/vnd.powerbuilder7-s": { "source": "iana" },
		"application/vnd.powerbuilder75": { "source": "iana" },
		"application/vnd.powerbuilder75-s": { "source": "iana" },
		"application/vnd.preminet": { "source": "iana" },
		"application/vnd.previewsystems.box": {
			"source": "iana",
			"extensions": ["box"]
		},
		"application/vnd.proteus.magazine": {
			"source": "iana",
			"extensions": ["mgz"]
		},
		"application/vnd.psfs": { "source": "iana" },
		"application/vnd.publishare-delta-tree": {
			"source": "iana",
			"extensions": ["qps"]
		},
		"application/vnd.pvi.ptid1": {
			"source": "iana",
			"extensions": ["ptid"]
		},
		"application/vnd.pwg-multiplexed": { "source": "iana" },
		"application/vnd.pwg-xhtml-print+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.qualcomm.brew-app-res": { "source": "iana" },
		"application/vnd.quarantainenet": { "source": "iana" },
		"application/vnd.quark.quarkxpress": {
			"source": "iana",
			"extensions": [
				"qxd",
				"qxt",
				"qwd",
				"qwt",
				"qxl",
				"qxb"
			]
		},
		"application/vnd.quobject-quoxdocument": { "source": "iana" },
		"application/vnd.radisys.moml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-audit+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-audit-conf+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-audit-conn+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-audit-dialog+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-audit-stream+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-conf+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-dialog+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-dialog-base+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-dialog-fax-detect+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-dialog-group+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-dialog-speech+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.radisys.msml-dialog-transform+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.rainstor.data": { "source": "iana" },
		"application/vnd.rapid": { "source": "iana" },
		"application/vnd.rar": {
			"source": "iana",
			"extensions": ["rar"]
		},
		"application/vnd.realvnc.bed": {
			"source": "iana",
			"extensions": ["bed"]
		},
		"application/vnd.recordare.musicxml": {
			"source": "iana",
			"extensions": ["mxl"]
		},
		"application/vnd.recordare.musicxml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["musicxml"]
		},
		"application/vnd.renlearn.rlprint": { "source": "iana" },
		"application/vnd.resilient.logic": { "source": "iana" },
		"application/vnd.restful+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.rig.cryptonote": {
			"source": "iana",
			"extensions": ["cryptonote"]
		},
		"application/vnd.rim.cod": {
			"source": "apache",
			"extensions": ["cod"]
		},
		"application/vnd.rn-realmedia": {
			"source": "apache",
			"extensions": ["rm"]
		},
		"application/vnd.rn-realmedia-vbr": {
			"source": "apache",
			"extensions": ["rmvb"]
		},
		"application/vnd.route66.link66+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["link66"]
		},
		"application/vnd.rs-274x": { "source": "iana" },
		"application/vnd.ruckus.download": { "source": "iana" },
		"application/vnd.s3sms": { "source": "iana" },
		"application/vnd.sailingtracker.track": {
			"source": "iana",
			"extensions": ["st"]
		},
		"application/vnd.sar": { "source": "iana" },
		"application/vnd.sbm.cid": { "source": "iana" },
		"application/vnd.sbm.mid2": { "source": "iana" },
		"application/vnd.scribus": { "source": "iana" },
		"application/vnd.sealed.3df": { "source": "iana" },
		"application/vnd.sealed.csf": { "source": "iana" },
		"application/vnd.sealed.doc": { "source": "iana" },
		"application/vnd.sealed.eml": { "source": "iana" },
		"application/vnd.sealed.mht": { "source": "iana" },
		"application/vnd.sealed.net": { "source": "iana" },
		"application/vnd.sealed.ppt": { "source": "iana" },
		"application/vnd.sealed.tiff": { "source": "iana" },
		"application/vnd.sealed.xls": { "source": "iana" },
		"application/vnd.sealedmedia.softseal.html": { "source": "iana" },
		"application/vnd.sealedmedia.softseal.pdf": { "source": "iana" },
		"application/vnd.seemail": {
			"source": "iana",
			"extensions": ["see"]
		},
		"application/vnd.seis+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.sema": {
			"source": "iana",
			"extensions": ["sema"]
		},
		"application/vnd.semd": {
			"source": "iana",
			"extensions": ["semd"]
		},
		"application/vnd.semf": {
			"source": "iana",
			"extensions": ["semf"]
		},
		"application/vnd.shade-save-file": { "source": "iana" },
		"application/vnd.shana.informed.formdata": {
			"source": "iana",
			"extensions": ["ifm"]
		},
		"application/vnd.shana.informed.formtemplate": {
			"source": "iana",
			"extensions": ["itp"]
		},
		"application/vnd.shana.informed.interchange": {
			"source": "iana",
			"extensions": ["iif"]
		},
		"application/vnd.shana.informed.package": {
			"source": "iana",
			"extensions": ["ipk"]
		},
		"application/vnd.shootproof+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.shopkick+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.shp": { "source": "iana" },
		"application/vnd.shx": { "source": "iana" },
		"application/vnd.sigrok.session": { "source": "iana" },
		"application/vnd.simtech-mindmapper": {
			"source": "iana",
			"extensions": ["twd", "twds"]
		},
		"application/vnd.siren+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.smaf": {
			"source": "iana",
			"extensions": ["mmf"]
		},
		"application/vnd.smart.notebook": { "source": "iana" },
		"application/vnd.smart.teacher": {
			"source": "iana",
			"extensions": ["teacher"]
		},
		"application/vnd.snesdev-page-table": { "source": "iana" },
		"application/vnd.software602.filler.form+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["fo"]
		},
		"application/vnd.software602.filler.form-xml-zip": { "source": "iana" },
		"application/vnd.solent.sdkm+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["sdkm", "sdkd"]
		},
		"application/vnd.spotfire.dxp": {
			"source": "iana",
			"extensions": ["dxp"]
		},
		"application/vnd.spotfire.sfs": {
			"source": "iana",
			"extensions": ["sfs"]
		},
		"application/vnd.sqlite3": { "source": "iana" },
		"application/vnd.sss-cod": { "source": "iana" },
		"application/vnd.sss-dtf": { "source": "iana" },
		"application/vnd.sss-ntf": { "source": "iana" },
		"application/vnd.stardivision.calc": {
			"source": "apache",
			"extensions": ["sdc"]
		},
		"application/vnd.stardivision.draw": {
			"source": "apache",
			"extensions": ["sda"]
		},
		"application/vnd.stardivision.impress": {
			"source": "apache",
			"extensions": ["sdd"]
		},
		"application/vnd.stardivision.math": {
			"source": "apache",
			"extensions": ["smf"]
		},
		"application/vnd.stardivision.writer": {
			"source": "apache",
			"extensions": ["sdw", "vor"]
		},
		"application/vnd.stardivision.writer-global": {
			"source": "apache",
			"extensions": ["sgl"]
		},
		"application/vnd.stepmania.package": {
			"source": "iana",
			"extensions": ["smzip"]
		},
		"application/vnd.stepmania.stepchart": {
			"source": "iana",
			"extensions": ["sm"]
		},
		"application/vnd.street-stream": { "source": "iana" },
		"application/vnd.sun.wadl+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["wadl"]
		},
		"application/vnd.sun.xml.calc": {
			"source": "apache",
			"extensions": ["sxc"]
		},
		"application/vnd.sun.xml.calc.template": {
			"source": "apache",
			"extensions": ["stc"]
		},
		"application/vnd.sun.xml.draw": {
			"source": "apache",
			"extensions": ["sxd"]
		},
		"application/vnd.sun.xml.draw.template": {
			"source": "apache",
			"extensions": ["std"]
		},
		"application/vnd.sun.xml.impress": {
			"source": "apache",
			"extensions": ["sxi"]
		},
		"application/vnd.sun.xml.impress.template": {
			"source": "apache",
			"extensions": ["sti"]
		},
		"application/vnd.sun.xml.math": {
			"source": "apache",
			"extensions": ["sxm"]
		},
		"application/vnd.sun.xml.writer": {
			"source": "apache",
			"extensions": ["sxw"]
		},
		"application/vnd.sun.xml.writer.global": {
			"source": "apache",
			"extensions": ["sxg"]
		},
		"application/vnd.sun.xml.writer.template": {
			"source": "apache",
			"extensions": ["stw"]
		},
		"application/vnd.sus-calendar": {
			"source": "iana",
			"extensions": ["sus", "susp"]
		},
		"application/vnd.svd": {
			"source": "iana",
			"extensions": ["svd"]
		},
		"application/vnd.swiftview-ics": { "source": "iana" },
		"application/vnd.sycle+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.syft+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.symbian.install": {
			"source": "apache",
			"extensions": ["sis", "sisx"]
		},
		"application/vnd.syncml+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["xsm"]
		},
		"application/vnd.syncml.dm+wbxml": {
			"source": "iana",
			"charset": "UTF-8",
			"extensions": ["bdm"]
		},
		"application/vnd.syncml.dm+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["xdm"]
		},
		"application/vnd.syncml.dm.notification": { "source": "iana" },
		"application/vnd.syncml.dmddf+wbxml": { "source": "iana" },
		"application/vnd.syncml.dmddf+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["ddf"]
		},
		"application/vnd.syncml.dmtnds+wbxml": { "source": "iana" },
		"application/vnd.syncml.dmtnds+xml": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true
		},
		"application/vnd.syncml.ds.notification": { "source": "iana" },
		"application/vnd.tableschema+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.tao.intent-module-archive": {
			"source": "iana",
			"extensions": ["tao"]
		},
		"application/vnd.tcpdump.pcap": {
			"source": "iana",
			"extensions": [
				"pcap",
				"cap",
				"dmp"
			]
		},
		"application/vnd.think-cell.ppttc+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.tmd.mediaflex.api+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.tml": { "source": "iana" },
		"application/vnd.tmobile-livetv": {
			"source": "iana",
			"extensions": ["tmo"]
		},
		"application/vnd.tri.onesource": { "source": "iana" },
		"application/vnd.trid.tpt": {
			"source": "iana",
			"extensions": ["tpt"]
		},
		"application/vnd.triscape.mxs": {
			"source": "iana",
			"extensions": ["mxs"]
		},
		"application/vnd.trueapp": {
			"source": "iana",
			"extensions": ["tra"]
		},
		"application/vnd.truedoc": { "source": "iana" },
		"application/vnd.ubisoft.webplayer": { "source": "iana" },
		"application/vnd.ufdl": {
			"source": "iana",
			"extensions": ["ufd", "ufdl"]
		},
		"application/vnd.uiq.theme": {
			"source": "iana",
			"extensions": ["utz"]
		},
		"application/vnd.umajin": {
			"source": "iana",
			"extensions": ["umj"]
		},
		"application/vnd.unity": {
			"source": "iana",
			"extensions": ["unityweb"]
		},
		"application/vnd.uoml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["uoml"]
		},
		"application/vnd.uplanet.alert": { "source": "iana" },
		"application/vnd.uplanet.alert-wbxml": { "source": "iana" },
		"application/vnd.uplanet.bearer-choice": { "source": "iana" },
		"application/vnd.uplanet.bearer-choice-wbxml": { "source": "iana" },
		"application/vnd.uplanet.cacheop": { "source": "iana" },
		"application/vnd.uplanet.cacheop-wbxml": { "source": "iana" },
		"application/vnd.uplanet.channel": { "source": "iana" },
		"application/vnd.uplanet.channel-wbxml": { "source": "iana" },
		"application/vnd.uplanet.list": { "source": "iana" },
		"application/vnd.uplanet.list-wbxml": { "source": "iana" },
		"application/vnd.uplanet.listcmd": { "source": "iana" },
		"application/vnd.uplanet.listcmd-wbxml": { "source": "iana" },
		"application/vnd.uplanet.signal": { "source": "iana" },
		"application/vnd.uri-map": { "source": "iana" },
		"application/vnd.valve.source.material": { "source": "iana" },
		"application/vnd.vcx": {
			"source": "iana",
			"extensions": ["vcx"]
		},
		"application/vnd.vd-study": { "source": "iana" },
		"application/vnd.vectorworks": { "source": "iana" },
		"application/vnd.vel+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.verimatrix.vcas": { "source": "iana" },
		"application/vnd.veritone.aion+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.veryant.thin": { "source": "iana" },
		"application/vnd.ves.encrypted": { "source": "iana" },
		"application/vnd.vidsoft.vidconference": { "source": "iana" },
		"application/vnd.visio": {
			"source": "iana",
			"extensions": [
				"vsd",
				"vst",
				"vss",
				"vsw"
			]
		},
		"application/vnd.visionary": {
			"source": "iana",
			"extensions": ["vis"]
		},
		"application/vnd.vividence.scriptfile": { "source": "iana" },
		"application/vnd.vsf": {
			"source": "iana",
			"extensions": ["vsf"]
		},
		"application/vnd.wap.sic": { "source": "iana" },
		"application/vnd.wap.slc": { "source": "iana" },
		"application/vnd.wap.wbxml": {
			"source": "iana",
			"charset": "UTF-8",
			"extensions": ["wbxml"]
		},
		"application/vnd.wap.wmlc": {
			"source": "iana",
			"extensions": ["wmlc"]
		},
		"application/vnd.wap.wmlscriptc": {
			"source": "iana",
			"extensions": ["wmlsc"]
		},
		"application/vnd.webturbo": {
			"source": "iana",
			"extensions": ["wtb"]
		},
		"application/vnd.wfa.dpp": { "source": "iana" },
		"application/vnd.wfa.p2p": { "source": "iana" },
		"application/vnd.wfa.wsc": { "source": "iana" },
		"application/vnd.windows.devicepairing": { "source": "iana" },
		"application/vnd.wmc": { "source": "iana" },
		"application/vnd.wmf.bootstrap": { "source": "iana" },
		"application/vnd.wolfram.mathematica": { "source": "iana" },
		"application/vnd.wolfram.mathematica.package": { "source": "iana" },
		"application/vnd.wolfram.player": {
			"source": "iana",
			"extensions": ["nbp"]
		},
		"application/vnd.wordperfect": {
			"source": "iana",
			"extensions": ["wpd"]
		},
		"application/vnd.wqd": {
			"source": "iana",
			"extensions": ["wqd"]
		},
		"application/vnd.wrq-hp3000-labelled": { "source": "iana" },
		"application/vnd.wt.stf": {
			"source": "iana",
			"extensions": ["stf"]
		},
		"application/vnd.wv.csp+wbxml": { "source": "iana" },
		"application/vnd.wv.csp+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.wv.ssp+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.xacml+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.xara": {
			"source": "iana",
			"extensions": ["xar"]
		},
		"application/vnd.xfdl": {
			"source": "iana",
			"extensions": ["xfdl"]
		},
		"application/vnd.xfdl.webform": { "source": "iana" },
		"application/vnd.xmi+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/vnd.xmpie.cpkg": { "source": "iana" },
		"application/vnd.xmpie.dpkg": { "source": "iana" },
		"application/vnd.xmpie.plan": { "source": "iana" },
		"application/vnd.xmpie.ppkg": { "source": "iana" },
		"application/vnd.xmpie.xlim": { "source": "iana" },
		"application/vnd.yamaha.hv-dic": {
			"source": "iana",
			"extensions": ["hvd"]
		},
		"application/vnd.yamaha.hv-script": {
			"source": "iana",
			"extensions": ["hvs"]
		},
		"application/vnd.yamaha.hv-voice": {
			"source": "iana",
			"extensions": ["hvp"]
		},
		"application/vnd.yamaha.openscoreformat": {
			"source": "iana",
			"extensions": ["osf"]
		},
		"application/vnd.yamaha.openscoreformat.osfpvg+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["osfpvg"]
		},
		"application/vnd.yamaha.remote-setup": { "source": "iana" },
		"application/vnd.yamaha.smaf-audio": {
			"source": "iana",
			"extensions": ["saf"]
		},
		"application/vnd.yamaha.smaf-phrase": {
			"source": "iana",
			"extensions": ["spf"]
		},
		"application/vnd.yamaha.through-ngn": { "source": "iana" },
		"application/vnd.yamaha.tunnel-udpencap": { "source": "iana" },
		"application/vnd.yaoweme": { "source": "iana" },
		"application/vnd.yellowriver-custom-menu": {
			"source": "iana",
			"extensions": ["cmp"]
		},
		"application/vnd.youtube.yt": { "source": "iana" },
		"application/vnd.zul": {
			"source": "iana",
			"extensions": ["zir", "zirz"]
		},
		"application/vnd.zzazz.deck+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["zaz"]
		},
		"application/voicexml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["vxml"]
		},
		"application/voucher-cms+json": {
			"source": "iana",
			"compressible": true
		},
		"application/vq-rtcpxr": { "source": "iana" },
		"application/wasm": {
			"source": "iana",
			"compressible": true,
			"extensions": ["wasm"]
		},
		"application/watcherinfo+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["wif"]
		},
		"application/webpush-options+json": {
			"source": "iana",
			"compressible": true
		},
		"application/whoispp-query": { "source": "iana" },
		"application/whoispp-response": { "source": "iana" },
		"application/widget": {
			"source": "iana",
			"extensions": ["wgt"]
		},
		"application/winhlp": {
			"source": "apache",
			"extensions": ["hlp"]
		},
		"application/wita": { "source": "iana" },
		"application/wordperfect5.1": { "source": "iana" },
		"application/wsdl+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["wsdl"]
		},
		"application/wspolicy+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["wspolicy"]
		},
		"application/x-7z-compressed": {
			"source": "apache",
			"compressible": false,
			"extensions": ["7z"]
		},
		"application/x-abiword": {
			"source": "apache",
			"extensions": ["abw"]
		},
		"application/x-ace-compressed": {
			"source": "apache",
			"extensions": ["ace"]
		},
		"application/x-amf": { "source": "apache" },
		"application/x-apple-diskimage": {
			"source": "apache",
			"extensions": ["dmg"]
		},
		"application/x-arj": {
			"compressible": false,
			"extensions": ["arj"]
		},
		"application/x-authorware-bin": {
			"source": "apache",
			"extensions": [
				"aab",
				"x32",
				"u32",
				"vox"
			]
		},
		"application/x-authorware-map": {
			"source": "apache",
			"extensions": ["aam"]
		},
		"application/x-authorware-seg": {
			"source": "apache",
			"extensions": ["aas"]
		},
		"application/x-bcpio": {
			"source": "apache",
			"extensions": ["bcpio"]
		},
		"application/x-bdoc": {
			"compressible": false,
			"extensions": ["bdoc"]
		},
		"application/x-bittorrent": {
			"source": "apache",
			"extensions": ["torrent"]
		},
		"application/x-blorb": {
			"source": "apache",
			"extensions": ["blb", "blorb"]
		},
		"application/x-bzip": {
			"source": "apache",
			"compressible": false,
			"extensions": ["bz"]
		},
		"application/x-bzip2": {
			"source": "apache",
			"compressible": false,
			"extensions": ["bz2", "boz"]
		},
		"application/x-cbr": {
			"source": "apache",
			"extensions": [
				"cbr",
				"cba",
				"cbt",
				"cbz",
				"cb7"
			]
		},
		"application/x-cdlink": {
			"source": "apache",
			"extensions": ["vcd"]
		},
		"application/x-cfs-compressed": {
			"source": "apache",
			"extensions": ["cfs"]
		},
		"application/x-chat": {
			"source": "apache",
			"extensions": ["chat"]
		},
		"application/x-chess-pgn": {
			"source": "apache",
			"extensions": ["pgn"]
		},
		"application/x-chrome-extension": { "extensions": ["crx"] },
		"application/x-cocoa": {
			"source": "nginx",
			"extensions": ["cco"]
		},
		"application/x-compress": { "source": "apache" },
		"application/x-conference": {
			"source": "apache",
			"extensions": ["nsc"]
		},
		"application/x-cpio": {
			"source": "apache",
			"extensions": ["cpio"]
		},
		"application/x-csh": {
			"source": "apache",
			"extensions": ["csh"]
		},
		"application/x-deb": { "compressible": false },
		"application/x-debian-package": {
			"source": "apache",
			"extensions": ["deb", "udeb"]
		},
		"application/x-dgc-compressed": {
			"source": "apache",
			"extensions": ["dgc"]
		},
		"application/x-director": {
			"source": "apache",
			"extensions": [
				"dir",
				"dcr",
				"dxr",
				"cst",
				"cct",
				"cxt",
				"w3d",
				"fgd",
				"swa"
			]
		},
		"application/x-doom": {
			"source": "apache",
			"extensions": ["wad"]
		},
		"application/x-dtbncx+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["ncx"]
		},
		"application/x-dtbook+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["dtb"]
		},
		"application/x-dtbresource+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["res"]
		},
		"application/x-dvi": {
			"source": "apache",
			"compressible": false,
			"extensions": ["dvi"]
		},
		"application/x-envoy": {
			"source": "apache",
			"extensions": ["evy"]
		},
		"application/x-eva": {
			"source": "apache",
			"extensions": ["eva"]
		},
		"application/x-font-bdf": {
			"source": "apache",
			"extensions": ["bdf"]
		},
		"application/x-font-dos": { "source": "apache" },
		"application/x-font-framemaker": { "source": "apache" },
		"application/x-font-ghostscript": {
			"source": "apache",
			"extensions": ["gsf"]
		},
		"application/x-font-libgrx": { "source": "apache" },
		"application/x-font-linux-psf": {
			"source": "apache",
			"extensions": ["psf"]
		},
		"application/x-font-pcf": {
			"source": "apache",
			"extensions": ["pcf"]
		},
		"application/x-font-snf": {
			"source": "apache",
			"extensions": ["snf"]
		},
		"application/x-font-speedo": { "source": "apache" },
		"application/x-font-sunos-news": { "source": "apache" },
		"application/x-font-type1": {
			"source": "apache",
			"extensions": [
				"pfa",
				"pfb",
				"pfm",
				"afm"
			]
		},
		"application/x-font-vfont": { "source": "apache" },
		"application/x-freearc": {
			"source": "apache",
			"extensions": ["arc"]
		},
		"application/x-futuresplash": {
			"source": "apache",
			"extensions": ["spl"]
		},
		"application/x-gca-compressed": {
			"source": "apache",
			"extensions": ["gca"]
		},
		"application/x-glulx": {
			"source": "apache",
			"extensions": ["ulx"]
		},
		"application/x-gnumeric": {
			"source": "apache",
			"extensions": ["gnumeric"]
		},
		"application/x-gramps-xml": {
			"source": "apache",
			"extensions": ["gramps"]
		},
		"application/x-gtar": {
			"source": "apache",
			"extensions": ["gtar"]
		},
		"application/x-gzip": { "source": "apache" },
		"application/x-hdf": {
			"source": "apache",
			"extensions": ["hdf"]
		},
		"application/x-httpd-php": {
			"compressible": true,
			"extensions": ["php"]
		},
		"application/x-install-instructions": {
			"source": "apache",
			"extensions": ["install"]
		},
		"application/x-iso9660-image": {
			"source": "apache",
			"extensions": ["iso"]
		},
		"application/x-iwork-keynote-sffkey": { "extensions": ["key"] },
		"application/x-iwork-numbers-sffnumbers": { "extensions": ["numbers"] },
		"application/x-iwork-pages-sffpages": { "extensions": ["pages"] },
		"application/x-java-archive-diff": {
			"source": "nginx",
			"extensions": ["jardiff"]
		},
		"application/x-java-jnlp-file": {
			"source": "apache",
			"compressible": false,
			"extensions": ["jnlp"]
		},
		"application/x-javascript": { "compressible": true },
		"application/x-keepass2": { "extensions": ["kdbx"] },
		"application/x-latex": {
			"source": "apache",
			"compressible": false,
			"extensions": ["latex"]
		},
		"application/x-lua-bytecode": { "extensions": ["luac"] },
		"application/x-lzh-compressed": {
			"source": "apache",
			"extensions": ["lzh", "lha"]
		},
		"application/x-makeself": {
			"source": "nginx",
			"extensions": ["run"]
		},
		"application/x-mie": {
			"source": "apache",
			"extensions": ["mie"]
		},
		"application/x-mobipocket-ebook": {
			"source": "apache",
			"extensions": ["prc", "mobi"]
		},
		"application/x-mpegurl": { "compressible": false },
		"application/x-ms-application": {
			"source": "apache",
			"extensions": ["application"]
		},
		"application/x-ms-shortcut": {
			"source": "apache",
			"extensions": ["lnk"]
		},
		"application/x-ms-wmd": {
			"source": "apache",
			"extensions": ["wmd"]
		},
		"application/x-ms-wmz": {
			"source": "apache",
			"extensions": ["wmz"]
		},
		"application/x-ms-xbap": {
			"source": "apache",
			"extensions": ["xbap"]
		},
		"application/x-msaccess": {
			"source": "apache",
			"extensions": ["mdb"]
		},
		"application/x-msbinder": {
			"source": "apache",
			"extensions": ["obd"]
		},
		"application/x-mscardfile": {
			"source": "apache",
			"extensions": ["crd"]
		},
		"application/x-msclip": {
			"source": "apache",
			"extensions": ["clp"]
		},
		"application/x-msdos-program": { "extensions": ["exe"] },
		"application/x-msdownload": {
			"source": "apache",
			"extensions": [
				"exe",
				"dll",
				"com",
				"bat",
				"msi"
			]
		},
		"application/x-msmediaview": {
			"source": "apache",
			"extensions": [
				"mvb",
				"m13",
				"m14"
			]
		},
		"application/x-msmetafile": {
			"source": "apache",
			"extensions": [
				"wmf",
				"wmz",
				"emf",
				"emz"
			]
		},
		"application/x-msmoney": {
			"source": "apache",
			"extensions": ["mny"]
		},
		"application/x-mspublisher": {
			"source": "apache",
			"extensions": ["pub"]
		},
		"application/x-msschedule": {
			"source": "apache",
			"extensions": ["scd"]
		},
		"application/x-msterminal": {
			"source": "apache",
			"extensions": ["trm"]
		},
		"application/x-mswrite": {
			"source": "apache",
			"extensions": ["wri"]
		},
		"application/x-netcdf": {
			"source": "apache",
			"extensions": ["nc", "cdf"]
		},
		"application/x-ns-proxy-autoconfig": {
			"compressible": true,
			"extensions": ["pac"]
		},
		"application/x-nzb": {
			"source": "apache",
			"extensions": ["nzb"]
		},
		"application/x-perl": {
			"source": "nginx",
			"extensions": ["pl", "pm"]
		},
		"application/x-pilot": {
			"source": "nginx",
			"extensions": ["prc", "pdb"]
		},
		"application/x-pkcs12": {
			"source": "apache",
			"compressible": false,
			"extensions": ["p12", "pfx"]
		},
		"application/x-pkcs7-certificates": {
			"source": "apache",
			"extensions": ["p7b", "spc"]
		},
		"application/x-pkcs7-certreqresp": {
			"source": "apache",
			"extensions": ["p7r"]
		},
		"application/x-pki-message": { "source": "iana" },
		"application/x-rar-compressed": {
			"source": "apache",
			"compressible": false,
			"extensions": ["rar"]
		},
		"application/x-redhat-package-manager": {
			"source": "nginx",
			"extensions": ["rpm"]
		},
		"application/x-research-info-systems": {
			"source": "apache",
			"extensions": ["ris"]
		},
		"application/x-sea": {
			"source": "nginx",
			"extensions": ["sea"]
		},
		"application/x-sh": {
			"source": "apache",
			"compressible": true,
			"extensions": ["sh"]
		},
		"application/x-shar": {
			"source": "apache",
			"extensions": ["shar"]
		},
		"application/x-shockwave-flash": {
			"source": "apache",
			"compressible": false,
			"extensions": ["swf"]
		},
		"application/x-silverlight-app": {
			"source": "apache",
			"extensions": ["xap"]
		},
		"application/x-sql": {
			"source": "apache",
			"extensions": ["sql"]
		},
		"application/x-stuffit": {
			"source": "apache",
			"compressible": false,
			"extensions": ["sit"]
		},
		"application/x-stuffitx": {
			"source": "apache",
			"extensions": ["sitx"]
		},
		"application/x-subrip": {
			"source": "apache",
			"extensions": ["srt"]
		},
		"application/x-sv4cpio": {
			"source": "apache",
			"extensions": ["sv4cpio"]
		},
		"application/x-sv4crc": {
			"source": "apache",
			"extensions": ["sv4crc"]
		},
		"application/x-t3vm-image": {
			"source": "apache",
			"extensions": ["t3"]
		},
		"application/x-tads": {
			"source": "apache",
			"extensions": ["gam"]
		},
		"application/x-tar": {
			"source": "apache",
			"compressible": true,
			"extensions": ["tar"]
		},
		"application/x-tcl": {
			"source": "apache",
			"extensions": ["tcl", "tk"]
		},
		"application/x-tex": {
			"source": "apache",
			"extensions": ["tex"]
		},
		"application/x-tex-tfm": {
			"source": "apache",
			"extensions": ["tfm"]
		},
		"application/x-texinfo": {
			"source": "apache",
			"extensions": ["texinfo", "texi"]
		},
		"application/x-tgif": {
			"source": "apache",
			"extensions": ["obj"]
		},
		"application/x-ustar": {
			"source": "apache",
			"extensions": ["ustar"]
		},
		"application/x-virtualbox-hdd": {
			"compressible": true,
			"extensions": ["hdd"]
		},
		"application/x-virtualbox-ova": {
			"compressible": true,
			"extensions": ["ova"]
		},
		"application/x-virtualbox-ovf": {
			"compressible": true,
			"extensions": ["ovf"]
		},
		"application/x-virtualbox-vbox": {
			"compressible": true,
			"extensions": ["vbox"]
		},
		"application/x-virtualbox-vbox-extpack": {
			"compressible": false,
			"extensions": ["vbox-extpack"]
		},
		"application/x-virtualbox-vdi": {
			"compressible": true,
			"extensions": ["vdi"]
		},
		"application/x-virtualbox-vhd": {
			"compressible": true,
			"extensions": ["vhd"]
		},
		"application/x-virtualbox-vmdk": {
			"compressible": true,
			"extensions": ["vmdk"]
		},
		"application/x-wais-source": {
			"source": "apache",
			"extensions": ["src"]
		},
		"application/x-web-app-manifest+json": {
			"compressible": true,
			"extensions": ["webapp"]
		},
		"application/x-www-form-urlencoded": {
			"source": "iana",
			"compressible": true
		},
		"application/x-x509-ca-cert": {
			"source": "iana",
			"extensions": [
				"der",
				"crt",
				"pem"
			]
		},
		"application/x-x509-ca-ra-cert": { "source": "iana" },
		"application/x-x509-next-ca-cert": { "source": "iana" },
		"application/x-xfig": {
			"source": "apache",
			"extensions": ["fig"]
		},
		"application/x-xliff+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["xlf"]
		},
		"application/x-xpinstall": {
			"source": "apache",
			"compressible": false,
			"extensions": ["xpi"]
		},
		"application/x-xz": {
			"source": "apache",
			"extensions": ["xz"]
		},
		"application/x-zmachine": {
			"source": "apache",
			"extensions": [
				"z1",
				"z2",
				"z3",
				"z4",
				"z5",
				"z6",
				"z7",
				"z8"
			]
		},
		"application/x400-bp": { "source": "iana" },
		"application/xacml+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/xaml+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["xaml"]
		},
		"application/xcap-att+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xav"]
		},
		"application/xcap-caps+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xca"]
		},
		"application/xcap-diff+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xdf"]
		},
		"application/xcap-el+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xel"]
		},
		"application/xcap-error+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/xcap-ns+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xns"]
		},
		"application/xcon-conference-info+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/xcon-conference-info-diff+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/xenc+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xenc"]
		},
		"application/xhtml+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xhtml", "xht"]
		},
		"application/xhtml-voice+xml": {
			"source": "apache",
			"compressible": true
		},
		"application/xliff+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xlf"]
		},
		"application/xml": {
			"source": "iana",
			"compressible": true,
			"extensions": [
				"xml",
				"xsl",
				"xsd",
				"rng"
			]
		},
		"application/xml-dtd": {
			"source": "iana",
			"compressible": true,
			"extensions": ["dtd"]
		},
		"application/xml-external-parsed-entity": { "source": "iana" },
		"application/xml-patch+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/xmpp+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/xop+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xop"]
		},
		"application/xproc+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["xpl"]
		},
		"application/xslt+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xsl", "xslt"]
		},
		"application/xspf+xml": {
			"source": "apache",
			"compressible": true,
			"extensions": ["xspf"]
		},
		"application/xv+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": [
				"mxml",
				"xhvml",
				"xvml",
				"xvm"
			]
		},
		"application/yang": {
			"source": "iana",
			"extensions": ["yang"]
		},
		"application/yang-data+json": {
			"source": "iana",
			"compressible": true
		},
		"application/yang-data+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/yang-patch+json": {
			"source": "iana",
			"compressible": true
		},
		"application/yang-patch+xml": {
			"source": "iana",
			"compressible": true
		},
		"application/yin+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["yin"]
		},
		"application/zip": {
			"source": "iana",
			"compressible": false,
			"extensions": ["zip"]
		},
		"application/zlib": { "source": "iana" },
		"application/zstd": { "source": "iana" },
		"audio/1d-interleaved-parityfec": { "source": "iana" },
		"audio/32kadpcm": { "source": "iana" },
		"audio/3gpp": {
			"source": "iana",
			"compressible": false,
			"extensions": ["3gpp"]
		},
		"audio/3gpp2": { "source": "iana" },
		"audio/aac": { "source": "iana" },
		"audio/ac3": { "source": "iana" },
		"audio/adpcm": {
			"source": "apache",
			"extensions": ["adp"]
		},
		"audio/amr": {
			"source": "iana",
			"extensions": ["amr"]
		},
		"audio/amr-wb": { "source": "iana" },
		"audio/amr-wb+": { "source": "iana" },
		"audio/aptx": { "source": "iana" },
		"audio/asc": { "source": "iana" },
		"audio/atrac-advanced-lossless": { "source": "iana" },
		"audio/atrac-x": { "source": "iana" },
		"audio/atrac3": { "source": "iana" },
		"audio/basic": {
			"source": "iana",
			"compressible": false,
			"extensions": ["au", "snd"]
		},
		"audio/bv16": { "source": "iana" },
		"audio/bv32": { "source": "iana" },
		"audio/clearmode": { "source": "iana" },
		"audio/cn": { "source": "iana" },
		"audio/dat12": { "source": "iana" },
		"audio/dls": { "source": "iana" },
		"audio/dsr-es201108": { "source": "iana" },
		"audio/dsr-es202050": { "source": "iana" },
		"audio/dsr-es202211": { "source": "iana" },
		"audio/dsr-es202212": { "source": "iana" },
		"audio/dv": { "source": "iana" },
		"audio/dvi4": { "source": "iana" },
		"audio/eac3": { "source": "iana" },
		"audio/encaprtp": { "source": "iana" },
		"audio/evrc": { "source": "iana" },
		"audio/evrc-qcp": { "source": "iana" },
		"audio/evrc0": { "source": "iana" },
		"audio/evrc1": { "source": "iana" },
		"audio/evrcb": { "source": "iana" },
		"audio/evrcb0": { "source": "iana" },
		"audio/evrcb1": { "source": "iana" },
		"audio/evrcnw": { "source": "iana" },
		"audio/evrcnw0": { "source": "iana" },
		"audio/evrcnw1": { "source": "iana" },
		"audio/evrcwb": { "source": "iana" },
		"audio/evrcwb0": { "source": "iana" },
		"audio/evrcwb1": { "source": "iana" },
		"audio/evs": { "source": "iana" },
		"audio/flexfec": { "source": "iana" },
		"audio/fwdred": { "source": "iana" },
		"audio/g711-0": { "source": "iana" },
		"audio/g719": { "source": "iana" },
		"audio/g722": { "source": "iana" },
		"audio/g7221": { "source": "iana" },
		"audio/g723": { "source": "iana" },
		"audio/g726-16": { "source": "iana" },
		"audio/g726-24": { "source": "iana" },
		"audio/g726-32": { "source": "iana" },
		"audio/g726-40": { "source": "iana" },
		"audio/g728": { "source": "iana" },
		"audio/g729": { "source": "iana" },
		"audio/g7291": { "source": "iana" },
		"audio/g729d": { "source": "iana" },
		"audio/g729e": { "source": "iana" },
		"audio/gsm": { "source": "iana" },
		"audio/gsm-efr": { "source": "iana" },
		"audio/gsm-hr-08": { "source": "iana" },
		"audio/ilbc": { "source": "iana" },
		"audio/ip-mr_v2.5": { "source": "iana" },
		"audio/isac": { "source": "apache" },
		"audio/l16": { "source": "iana" },
		"audio/l20": { "source": "iana" },
		"audio/l24": {
			"source": "iana",
			"compressible": false
		},
		"audio/l8": { "source": "iana" },
		"audio/lpc": { "source": "iana" },
		"audio/melp": { "source": "iana" },
		"audio/melp1200": { "source": "iana" },
		"audio/melp2400": { "source": "iana" },
		"audio/melp600": { "source": "iana" },
		"audio/mhas": { "source": "iana" },
		"audio/midi": {
			"source": "apache",
			"extensions": [
				"mid",
				"midi",
				"kar",
				"rmi"
			]
		},
		"audio/mobile-xmf": {
			"source": "iana",
			"extensions": ["mxmf"]
		},
		"audio/mp3": {
			"compressible": false,
			"extensions": ["mp3"]
		},
		"audio/mp4": {
			"source": "iana",
			"compressible": false,
			"extensions": ["m4a", "mp4a"]
		},
		"audio/mp4a-latm": { "source": "iana" },
		"audio/mpa": { "source": "iana" },
		"audio/mpa-robust": { "source": "iana" },
		"audio/mpeg": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"mpga",
				"mp2",
				"mp2a",
				"mp3",
				"m2a",
				"m3a"
			]
		},
		"audio/mpeg4-generic": { "source": "iana" },
		"audio/musepack": { "source": "apache" },
		"audio/ogg": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"oga",
				"ogg",
				"spx",
				"opus"
			]
		},
		"audio/opus": { "source": "iana" },
		"audio/parityfec": { "source": "iana" },
		"audio/pcma": { "source": "iana" },
		"audio/pcma-wb": { "source": "iana" },
		"audio/pcmu": { "source": "iana" },
		"audio/pcmu-wb": { "source": "iana" },
		"audio/prs.sid": { "source": "iana" },
		"audio/qcelp": { "source": "iana" },
		"audio/raptorfec": { "source": "iana" },
		"audio/red": { "source": "iana" },
		"audio/rtp-enc-aescm128": { "source": "iana" },
		"audio/rtp-midi": { "source": "iana" },
		"audio/rtploopback": { "source": "iana" },
		"audio/rtx": { "source": "iana" },
		"audio/s3m": {
			"source": "apache",
			"extensions": ["s3m"]
		},
		"audio/scip": { "source": "iana" },
		"audio/silk": {
			"source": "apache",
			"extensions": ["sil"]
		},
		"audio/smv": { "source": "iana" },
		"audio/smv-qcp": { "source": "iana" },
		"audio/smv0": { "source": "iana" },
		"audio/sofa": { "source": "iana" },
		"audio/sp-midi": { "source": "iana" },
		"audio/speex": { "source": "iana" },
		"audio/t140c": { "source": "iana" },
		"audio/t38": { "source": "iana" },
		"audio/telephone-event": { "source": "iana" },
		"audio/tetra_acelp": { "source": "iana" },
		"audio/tetra_acelp_bb": { "source": "iana" },
		"audio/tone": { "source": "iana" },
		"audio/tsvcis": { "source": "iana" },
		"audio/uemclip": { "source": "iana" },
		"audio/ulpfec": { "source": "iana" },
		"audio/usac": { "source": "iana" },
		"audio/vdvi": { "source": "iana" },
		"audio/vmr-wb": { "source": "iana" },
		"audio/vnd.3gpp.iufp": { "source": "iana" },
		"audio/vnd.4sb": { "source": "iana" },
		"audio/vnd.audiokoz": { "source": "iana" },
		"audio/vnd.celp": { "source": "iana" },
		"audio/vnd.cisco.nse": { "source": "iana" },
		"audio/vnd.cmles.radio-events": { "source": "iana" },
		"audio/vnd.cns.anp1": { "source": "iana" },
		"audio/vnd.cns.inf1": { "source": "iana" },
		"audio/vnd.dece.audio": {
			"source": "iana",
			"extensions": ["uva", "uvva"]
		},
		"audio/vnd.digital-winds": {
			"source": "iana",
			"extensions": ["eol"]
		},
		"audio/vnd.dlna.adts": { "source": "iana" },
		"audio/vnd.dolby.heaac.1": { "source": "iana" },
		"audio/vnd.dolby.heaac.2": { "source": "iana" },
		"audio/vnd.dolby.mlp": { "source": "iana" },
		"audio/vnd.dolby.mps": { "source": "iana" },
		"audio/vnd.dolby.pl2": { "source": "iana" },
		"audio/vnd.dolby.pl2x": { "source": "iana" },
		"audio/vnd.dolby.pl2z": { "source": "iana" },
		"audio/vnd.dolby.pulse.1": { "source": "iana" },
		"audio/vnd.dra": {
			"source": "iana",
			"extensions": ["dra"]
		},
		"audio/vnd.dts": {
			"source": "iana",
			"extensions": ["dts"]
		},
		"audio/vnd.dts.hd": {
			"source": "iana",
			"extensions": ["dtshd"]
		},
		"audio/vnd.dts.uhd": { "source": "iana" },
		"audio/vnd.dvb.file": { "source": "iana" },
		"audio/vnd.everad.plj": { "source": "iana" },
		"audio/vnd.hns.audio": { "source": "iana" },
		"audio/vnd.lucent.voice": {
			"source": "iana",
			"extensions": ["lvp"]
		},
		"audio/vnd.ms-playready.media.pya": {
			"source": "iana",
			"extensions": ["pya"]
		},
		"audio/vnd.nokia.mobile-xmf": { "source": "iana" },
		"audio/vnd.nortel.vbk": { "source": "iana" },
		"audio/vnd.nuera.ecelp4800": {
			"source": "iana",
			"extensions": ["ecelp4800"]
		},
		"audio/vnd.nuera.ecelp7470": {
			"source": "iana",
			"extensions": ["ecelp7470"]
		},
		"audio/vnd.nuera.ecelp9600": {
			"source": "iana",
			"extensions": ["ecelp9600"]
		},
		"audio/vnd.octel.sbc": { "source": "iana" },
		"audio/vnd.presonus.multitrack": { "source": "iana" },
		"audio/vnd.qcelp": { "source": "iana" },
		"audio/vnd.rhetorex.32kadpcm": { "source": "iana" },
		"audio/vnd.rip": {
			"source": "iana",
			"extensions": ["rip"]
		},
		"audio/vnd.rn-realaudio": { "compressible": false },
		"audio/vnd.sealedmedia.softseal.mpeg": { "source": "iana" },
		"audio/vnd.vmx.cvsd": { "source": "iana" },
		"audio/vnd.wave": { "compressible": false },
		"audio/vorbis": {
			"source": "iana",
			"compressible": false
		},
		"audio/vorbis-config": { "source": "iana" },
		"audio/wav": {
			"compressible": false,
			"extensions": ["wav"]
		},
		"audio/wave": {
			"compressible": false,
			"extensions": ["wav"]
		},
		"audio/webm": {
			"source": "apache",
			"compressible": false,
			"extensions": ["weba"]
		},
		"audio/x-aac": {
			"source": "apache",
			"compressible": false,
			"extensions": ["aac"]
		},
		"audio/x-aiff": {
			"source": "apache",
			"extensions": [
				"aif",
				"aiff",
				"aifc"
			]
		},
		"audio/x-caf": {
			"source": "apache",
			"compressible": false,
			"extensions": ["caf"]
		},
		"audio/x-flac": {
			"source": "apache",
			"extensions": ["flac"]
		},
		"audio/x-m4a": {
			"source": "nginx",
			"extensions": ["m4a"]
		},
		"audio/x-matroska": {
			"source": "apache",
			"extensions": ["mka"]
		},
		"audio/x-mpegurl": {
			"source": "apache",
			"extensions": ["m3u"]
		},
		"audio/x-ms-wax": {
			"source": "apache",
			"extensions": ["wax"]
		},
		"audio/x-ms-wma": {
			"source": "apache",
			"extensions": ["wma"]
		},
		"audio/x-pn-realaudio": {
			"source": "apache",
			"extensions": ["ram", "ra"]
		},
		"audio/x-pn-realaudio-plugin": {
			"source": "apache",
			"extensions": ["rmp"]
		},
		"audio/x-realaudio": {
			"source": "nginx",
			"extensions": ["ra"]
		},
		"audio/x-tta": { "source": "apache" },
		"audio/x-wav": {
			"source": "apache",
			"extensions": ["wav"]
		},
		"audio/xm": {
			"source": "apache",
			"extensions": ["xm"]
		},
		"chemical/x-cdx": {
			"source": "apache",
			"extensions": ["cdx"]
		},
		"chemical/x-cif": {
			"source": "apache",
			"extensions": ["cif"]
		},
		"chemical/x-cmdf": {
			"source": "apache",
			"extensions": ["cmdf"]
		},
		"chemical/x-cml": {
			"source": "apache",
			"extensions": ["cml"]
		},
		"chemical/x-csml": {
			"source": "apache",
			"extensions": ["csml"]
		},
		"chemical/x-pdb": { "source": "apache" },
		"chemical/x-xyz": {
			"source": "apache",
			"extensions": ["xyz"]
		},
		"font/collection": {
			"source": "iana",
			"extensions": ["ttc"]
		},
		"font/otf": {
			"source": "iana",
			"compressible": true,
			"extensions": ["otf"]
		},
		"font/sfnt": { "source": "iana" },
		"font/ttf": {
			"source": "iana",
			"compressible": true,
			"extensions": ["ttf"]
		},
		"font/woff": {
			"source": "iana",
			"extensions": ["woff"]
		},
		"font/woff2": {
			"source": "iana",
			"extensions": ["woff2"]
		},
		"image/aces": {
			"source": "iana",
			"extensions": ["exr"]
		},
		"image/apng": {
			"compressible": false,
			"extensions": ["apng"]
		},
		"image/avci": {
			"source": "iana",
			"extensions": ["avci"]
		},
		"image/avcs": {
			"source": "iana",
			"extensions": ["avcs"]
		},
		"image/avif": {
			"source": "iana",
			"compressible": false,
			"extensions": ["avif"]
		},
		"image/bmp": {
			"source": "iana",
			"compressible": true,
			"extensions": ["bmp"]
		},
		"image/cgm": {
			"source": "iana",
			"extensions": ["cgm"]
		},
		"image/dicom-rle": {
			"source": "iana",
			"extensions": ["drle"]
		},
		"image/emf": {
			"source": "iana",
			"extensions": ["emf"]
		},
		"image/fits": {
			"source": "iana",
			"extensions": ["fits"]
		},
		"image/g3fax": {
			"source": "iana",
			"extensions": ["g3"]
		},
		"image/gif": {
			"source": "iana",
			"compressible": false,
			"extensions": ["gif"]
		},
		"image/heic": {
			"source": "iana",
			"extensions": ["heic"]
		},
		"image/heic-sequence": {
			"source": "iana",
			"extensions": ["heics"]
		},
		"image/heif": {
			"source": "iana",
			"extensions": ["heif"]
		},
		"image/heif-sequence": {
			"source": "iana",
			"extensions": ["heifs"]
		},
		"image/hej2k": {
			"source": "iana",
			"extensions": ["hej2"]
		},
		"image/hsj2": {
			"source": "iana",
			"extensions": ["hsj2"]
		},
		"image/ief": {
			"source": "iana",
			"extensions": ["ief"]
		},
		"image/jls": {
			"source": "iana",
			"extensions": ["jls"]
		},
		"image/jp2": {
			"source": "iana",
			"compressible": false,
			"extensions": ["jp2", "jpg2"]
		},
		"image/jpeg": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"jpeg",
				"jpg",
				"jpe"
			]
		},
		"image/jph": {
			"source": "iana",
			"extensions": ["jph"]
		},
		"image/jphc": {
			"source": "iana",
			"extensions": ["jhc"]
		},
		"image/jpm": {
			"source": "iana",
			"compressible": false,
			"extensions": ["jpm"]
		},
		"image/jpx": {
			"source": "iana",
			"compressible": false,
			"extensions": ["jpx", "jpf"]
		},
		"image/jxr": {
			"source": "iana",
			"extensions": ["jxr"]
		},
		"image/jxra": {
			"source": "iana",
			"extensions": ["jxra"]
		},
		"image/jxrs": {
			"source": "iana",
			"extensions": ["jxrs"]
		},
		"image/jxs": {
			"source": "iana",
			"extensions": ["jxs"]
		},
		"image/jxsc": {
			"source": "iana",
			"extensions": ["jxsc"]
		},
		"image/jxsi": {
			"source": "iana",
			"extensions": ["jxsi"]
		},
		"image/jxss": {
			"source": "iana",
			"extensions": ["jxss"]
		},
		"image/ktx": {
			"source": "iana",
			"extensions": ["ktx"]
		},
		"image/ktx2": {
			"source": "iana",
			"extensions": ["ktx2"]
		},
		"image/naplps": { "source": "iana" },
		"image/pjpeg": { "compressible": false },
		"image/png": {
			"source": "iana",
			"compressible": false,
			"extensions": ["png"]
		},
		"image/prs.btif": {
			"source": "iana",
			"extensions": ["btif"]
		},
		"image/prs.pti": {
			"source": "iana",
			"extensions": ["pti"]
		},
		"image/pwg-raster": { "source": "iana" },
		"image/sgi": {
			"source": "apache",
			"extensions": ["sgi"]
		},
		"image/svg+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["svg", "svgz"]
		},
		"image/t38": {
			"source": "iana",
			"extensions": ["t38"]
		},
		"image/tiff": {
			"source": "iana",
			"compressible": false,
			"extensions": ["tif", "tiff"]
		},
		"image/tiff-fx": {
			"source": "iana",
			"extensions": ["tfx"]
		},
		"image/vnd.adobe.photoshop": {
			"source": "iana",
			"compressible": true,
			"extensions": ["psd"]
		},
		"image/vnd.airzip.accelerator.azv": {
			"source": "iana",
			"extensions": ["azv"]
		},
		"image/vnd.cns.inf2": { "source": "iana" },
		"image/vnd.dece.graphic": {
			"source": "iana",
			"extensions": [
				"uvi",
				"uvvi",
				"uvg",
				"uvvg"
			]
		},
		"image/vnd.djvu": {
			"source": "iana",
			"extensions": ["djvu", "djv"]
		},
		"image/vnd.dvb.subtitle": {
			"source": "iana",
			"extensions": ["sub"]
		},
		"image/vnd.dwg": {
			"source": "iana",
			"extensions": ["dwg"]
		},
		"image/vnd.dxf": {
			"source": "iana",
			"extensions": ["dxf"]
		},
		"image/vnd.fastbidsheet": {
			"source": "iana",
			"extensions": ["fbs"]
		},
		"image/vnd.fpx": {
			"source": "iana",
			"extensions": ["fpx"]
		},
		"image/vnd.fst": {
			"source": "iana",
			"extensions": ["fst"]
		},
		"image/vnd.fujixerox.edmics-mmr": {
			"source": "iana",
			"extensions": ["mmr"]
		},
		"image/vnd.fujixerox.edmics-rlc": {
			"source": "iana",
			"extensions": ["rlc"]
		},
		"image/vnd.globalgraphics.pgb": { "source": "iana" },
		"image/vnd.microsoft.icon": {
			"source": "iana",
			"compressible": true,
			"extensions": ["ico"]
		},
		"image/vnd.mix": { "source": "iana" },
		"image/vnd.mozilla.apng": { "source": "iana" },
		"image/vnd.ms-dds": {
			"compressible": true,
			"extensions": ["dds"]
		},
		"image/vnd.ms-modi": {
			"source": "iana",
			"extensions": ["mdi"]
		},
		"image/vnd.ms-photo": {
			"source": "apache",
			"extensions": ["wdp"]
		},
		"image/vnd.net-fpx": {
			"source": "iana",
			"extensions": ["npx"]
		},
		"image/vnd.pco.b16": {
			"source": "iana",
			"extensions": ["b16"]
		},
		"image/vnd.radiance": { "source": "iana" },
		"image/vnd.sealed.png": { "source": "iana" },
		"image/vnd.sealedmedia.softseal.gif": { "source": "iana" },
		"image/vnd.sealedmedia.softseal.jpg": { "source": "iana" },
		"image/vnd.svf": { "source": "iana" },
		"image/vnd.tencent.tap": {
			"source": "iana",
			"extensions": ["tap"]
		},
		"image/vnd.valve.source.texture": {
			"source": "iana",
			"extensions": ["vtf"]
		},
		"image/vnd.wap.wbmp": {
			"source": "iana",
			"extensions": ["wbmp"]
		},
		"image/vnd.xiff": {
			"source": "iana",
			"extensions": ["xif"]
		},
		"image/vnd.zbrush.pcx": {
			"source": "iana",
			"extensions": ["pcx"]
		},
		"image/webp": {
			"source": "apache",
			"extensions": ["webp"]
		},
		"image/wmf": {
			"source": "iana",
			"extensions": ["wmf"]
		},
		"image/x-3ds": {
			"source": "apache",
			"extensions": ["3ds"]
		},
		"image/x-cmu-raster": {
			"source": "apache",
			"extensions": ["ras"]
		},
		"image/x-cmx": {
			"source": "apache",
			"extensions": ["cmx"]
		},
		"image/x-freehand": {
			"source": "apache",
			"extensions": [
				"fh",
				"fhc",
				"fh4",
				"fh5",
				"fh7"
			]
		},
		"image/x-icon": {
			"source": "apache",
			"compressible": true,
			"extensions": ["ico"]
		},
		"image/x-jng": {
			"source": "nginx",
			"extensions": ["jng"]
		},
		"image/x-mrsid-image": {
			"source": "apache",
			"extensions": ["sid"]
		},
		"image/x-ms-bmp": {
			"source": "nginx",
			"compressible": true,
			"extensions": ["bmp"]
		},
		"image/x-pcx": {
			"source": "apache",
			"extensions": ["pcx"]
		},
		"image/x-pict": {
			"source": "apache",
			"extensions": ["pic", "pct"]
		},
		"image/x-portable-anymap": {
			"source": "apache",
			"extensions": ["pnm"]
		},
		"image/x-portable-bitmap": {
			"source": "apache",
			"extensions": ["pbm"]
		},
		"image/x-portable-graymap": {
			"source": "apache",
			"extensions": ["pgm"]
		},
		"image/x-portable-pixmap": {
			"source": "apache",
			"extensions": ["ppm"]
		},
		"image/x-rgb": {
			"source": "apache",
			"extensions": ["rgb"]
		},
		"image/x-tga": {
			"source": "apache",
			"extensions": ["tga"]
		},
		"image/x-xbitmap": {
			"source": "apache",
			"extensions": ["xbm"]
		},
		"image/x-xcf": { "compressible": false },
		"image/x-xpixmap": {
			"source": "apache",
			"extensions": ["xpm"]
		},
		"image/x-xwindowdump": {
			"source": "apache",
			"extensions": ["xwd"]
		},
		"message/cpim": { "source": "iana" },
		"message/delivery-status": { "source": "iana" },
		"message/disposition-notification": {
			"source": "iana",
			"extensions": ["disposition-notification"]
		},
		"message/external-body": { "source": "iana" },
		"message/feedback-report": { "source": "iana" },
		"message/global": {
			"source": "iana",
			"extensions": ["u8msg"]
		},
		"message/global-delivery-status": {
			"source": "iana",
			"extensions": ["u8dsn"]
		},
		"message/global-disposition-notification": {
			"source": "iana",
			"extensions": ["u8mdn"]
		},
		"message/global-headers": {
			"source": "iana",
			"extensions": ["u8hdr"]
		},
		"message/http": {
			"source": "iana",
			"compressible": false
		},
		"message/imdn+xml": {
			"source": "iana",
			"compressible": true
		},
		"message/news": { "source": "iana" },
		"message/partial": {
			"source": "iana",
			"compressible": false
		},
		"message/rfc822": {
			"source": "iana",
			"compressible": true,
			"extensions": ["eml", "mime"]
		},
		"message/s-http": { "source": "iana" },
		"message/sip": { "source": "iana" },
		"message/sipfrag": { "source": "iana" },
		"message/tracking-status": { "source": "iana" },
		"message/vnd.si.simp": { "source": "iana" },
		"message/vnd.wfa.wsc": {
			"source": "iana",
			"extensions": ["wsc"]
		},
		"model/3mf": {
			"source": "iana",
			"extensions": ["3mf"]
		},
		"model/e57": { "source": "iana" },
		"model/gltf+json": {
			"source": "iana",
			"compressible": true,
			"extensions": ["gltf"]
		},
		"model/gltf-binary": {
			"source": "iana",
			"compressible": true,
			"extensions": ["glb"]
		},
		"model/iges": {
			"source": "iana",
			"compressible": false,
			"extensions": ["igs", "iges"]
		},
		"model/mesh": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"msh",
				"mesh",
				"silo"
			]
		},
		"model/mtl": {
			"source": "iana",
			"extensions": ["mtl"]
		},
		"model/obj": {
			"source": "iana",
			"extensions": ["obj"]
		},
		"model/step": { "source": "iana" },
		"model/step+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["stpx"]
		},
		"model/step+zip": {
			"source": "iana",
			"compressible": false,
			"extensions": ["stpz"]
		},
		"model/step-xml+zip": {
			"source": "iana",
			"compressible": false,
			"extensions": ["stpxz"]
		},
		"model/stl": {
			"source": "iana",
			"extensions": ["stl"]
		},
		"model/vnd.collada+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["dae"]
		},
		"model/vnd.dwf": {
			"source": "iana",
			"extensions": ["dwf"]
		},
		"model/vnd.flatland.3dml": { "source": "iana" },
		"model/vnd.gdl": {
			"source": "iana",
			"extensions": ["gdl"]
		},
		"model/vnd.gs-gdl": { "source": "apache" },
		"model/vnd.gs.gdl": { "source": "iana" },
		"model/vnd.gtw": {
			"source": "iana",
			"extensions": ["gtw"]
		},
		"model/vnd.moml+xml": {
			"source": "iana",
			"compressible": true
		},
		"model/vnd.mts": {
			"source": "iana",
			"extensions": ["mts"]
		},
		"model/vnd.opengex": {
			"source": "iana",
			"extensions": ["ogex"]
		},
		"model/vnd.parasolid.transmit.binary": {
			"source": "iana",
			"extensions": ["x_b"]
		},
		"model/vnd.parasolid.transmit.text": {
			"source": "iana",
			"extensions": ["x_t"]
		},
		"model/vnd.pytha.pyox": { "source": "iana" },
		"model/vnd.rosette.annotated-data-model": { "source": "iana" },
		"model/vnd.sap.vds": {
			"source": "iana",
			"extensions": ["vds"]
		},
		"model/vnd.usdz+zip": {
			"source": "iana",
			"compressible": false,
			"extensions": ["usdz"]
		},
		"model/vnd.valve.source.compiled-map": {
			"source": "iana",
			"extensions": ["bsp"]
		},
		"model/vnd.vtu": {
			"source": "iana",
			"extensions": ["vtu"]
		},
		"model/vrml": {
			"source": "iana",
			"compressible": false,
			"extensions": ["wrl", "vrml"]
		},
		"model/x3d+binary": {
			"source": "apache",
			"compressible": false,
			"extensions": ["x3db", "x3dbz"]
		},
		"model/x3d+fastinfoset": {
			"source": "iana",
			"extensions": ["x3db"]
		},
		"model/x3d+vrml": {
			"source": "apache",
			"compressible": false,
			"extensions": ["x3dv", "x3dvz"]
		},
		"model/x3d+xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["x3d", "x3dz"]
		},
		"model/x3d-vrml": {
			"source": "iana",
			"extensions": ["x3dv"]
		},
		"multipart/alternative": {
			"source": "iana",
			"compressible": false
		},
		"multipart/appledouble": { "source": "iana" },
		"multipart/byteranges": { "source": "iana" },
		"multipart/digest": { "source": "iana" },
		"multipart/encrypted": {
			"source": "iana",
			"compressible": false
		},
		"multipart/form-data": {
			"source": "iana",
			"compressible": false
		},
		"multipart/header-set": { "source": "iana" },
		"multipart/mixed": { "source": "iana" },
		"multipart/multilingual": { "source": "iana" },
		"multipart/parallel": { "source": "iana" },
		"multipart/related": {
			"source": "iana",
			"compressible": false
		},
		"multipart/report": { "source": "iana" },
		"multipart/signed": {
			"source": "iana",
			"compressible": false
		},
		"multipart/vnd.bint.med-plus": { "source": "iana" },
		"multipart/voice-message": { "source": "iana" },
		"multipart/x-mixed-replace": { "source": "iana" },
		"text/1d-interleaved-parityfec": { "source": "iana" },
		"text/cache-manifest": {
			"source": "iana",
			"compressible": true,
			"extensions": ["appcache", "manifest"]
		},
		"text/calendar": {
			"source": "iana",
			"extensions": ["ics", "ifb"]
		},
		"text/calender": { "compressible": true },
		"text/cmd": { "compressible": true },
		"text/coffeescript": { "extensions": ["coffee", "litcoffee"] },
		"text/cql": { "source": "iana" },
		"text/cql-expression": { "source": "iana" },
		"text/cql-identifier": { "source": "iana" },
		"text/css": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["css"]
		},
		"text/csv": {
			"source": "iana",
			"compressible": true,
			"extensions": ["csv"]
		},
		"text/csv-schema": { "source": "iana" },
		"text/directory": { "source": "iana" },
		"text/dns": { "source": "iana" },
		"text/ecmascript": { "source": "iana" },
		"text/encaprtp": { "source": "iana" },
		"text/enriched": { "source": "iana" },
		"text/fhirpath": { "source": "iana" },
		"text/flexfec": { "source": "iana" },
		"text/fwdred": { "source": "iana" },
		"text/gff3": { "source": "iana" },
		"text/grammar-ref-list": { "source": "iana" },
		"text/html": {
			"source": "iana",
			"compressible": true,
			"extensions": [
				"html",
				"htm",
				"shtml"
			]
		},
		"text/jade": { "extensions": ["jade"] },
		"text/javascript": {
			"source": "iana",
			"compressible": true
		},
		"text/jcr-cnd": { "source": "iana" },
		"text/jsx": {
			"compressible": true,
			"extensions": ["jsx"]
		},
		"text/less": {
			"compressible": true,
			"extensions": ["less"]
		},
		"text/markdown": {
			"source": "iana",
			"compressible": true,
			"extensions": ["markdown", "md"]
		},
		"text/mathml": {
			"source": "nginx",
			"extensions": ["mml"]
		},
		"text/mdx": {
			"compressible": true,
			"extensions": ["mdx"]
		},
		"text/mizar": { "source": "iana" },
		"text/n3": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["n3"]
		},
		"text/parameters": {
			"source": "iana",
			"charset": "UTF-8"
		},
		"text/parityfec": { "source": "iana" },
		"text/plain": {
			"source": "iana",
			"compressible": true,
			"extensions": [
				"txt",
				"text",
				"conf",
				"def",
				"list",
				"log",
				"in",
				"ini"
			]
		},
		"text/provenance-notation": {
			"source": "iana",
			"charset": "UTF-8"
		},
		"text/prs.fallenstein.rst": { "source": "iana" },
		"text/prs.lines.tag": {
			"source": "iana",
			"extensions": ["dsc"]
		},
		"text/prs.prop.logic": { "source": "iana" },
		"text/raptorfec": { "source": "iana" },
		"text/red": { "source": "iana" },
		"text/rfc822-headers": { "source": "iana" },
		"text/richtext": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rtx"]
		},
		"text/rtf": {
			"source": "iana",
			"compressible": true,
			"extensions": ["rtf"]
		},
		"text/rtp-enc-aescm128": { "source": "iana" },
		"text/rtploopback": { "source": "iana" },
		"text/rtx": { "source": "iana" },
		"text/sgml": {
			"source": "iana",
			"extensions": ["sgml", "sgm"]
		},
		"text/shaclc": { "source": "iana" },
		"text/shex": {
			"source": "iana",
			"extensions": ["shex"]
		},
		"text/slim": { "extensions": ["slim", "slm"] },
		"text/spdx": {
			"source": "iana",
			"extensions": ["spdx"]
		},
		"text/strings": { "source": "iana" },
		"text/stylus": { "extensions": ["stylus", "styl"] },
		"text/t140": { "source": "iana" },
		"text/tab-separated-values": {
			"source": "iana",
			"compressible": true,
			"extensions": ["tsv"]
		},
		"text/troff": {
			"source": "iana",
			"extensions": [
				"t",
				"tr",
				"roff",
				"man",
				"me",
				"ms"
			]
		},
		"text/turtle": {
			"source": "iana",
			"charset": "UTF-8",
			"extensions": ["ttl"]
		},
		"text/ulpfec": { "source": "iana" },
		"text/uri-list": {
			"source": "iana",
			"compressible": true,
			"extensions": [
				"uri",
				"uris",
				"urls"
			]
		},
		"text/vcard": {
			"source": "iana",
			"compressible": true,
			"extensions": ["vcard"]
		},
		"text/vnd.a": { "source": "iana" },
		"text/vnd.abc": { "source": "iana" },
		"text/vnd.ascii-art": { "source": "iana" },
		"text/vnd.curl": {
			"source": "iana",
			"extensions": ["curl"]
		},
		"text/vnd.curl.dcurl": {
			"source": "apache",
			"extensions": ["dcurl"]
		},
		"text/vnd.curl.mcurl": {
			"source": "apache",
			"extensions": ["mcurl"]
		},
		"text/vnd.curl.scurl": {
			"source": "apache",
			"extensions": ["scurl"]
		},
		"text/vnd.debian.copyright": {
			"source": "iana",
			"charset": "UTF-8"
		},
		"text/vnd.dmclientscript": { "source": "iana" },
		"text/vnd.dvb.subtitle": {
			"source": "iana",
			"extensions": ["sub"]
		},
		"text/vnd.esmertec.theme-descriptor": {
			"source": "iana",
			"charset": "UTF-8"
		},
		"text/vnd.familysearch.gedcom": {
			"source": "iana",
			"extensions": ["ged"]
		},
		"text/vnd.ficlab.flt": { "source": "iana" },
		"text/vnd.fly": {
			"source": "iana",
			"extensions": ["fly"]
		},
		"text/vnd.fmi.flexstor": {
			"source": "iana",
			"extensions": ["flx"]
		},
		"text/vnd.gml": { "source": "iana" },
		"text/vnd.graphviz": {
			"source": "iana",
			"extensions": ["gv"]
		},
		"text/vnd.hans": { "source": "iana" },
		"text/vnd.hgl": { "source": "iana" },
		"text/vnd.in3d.3dml": {
			"source": "iana",
			"extensions": ["3dml"]
		},
		"text/vnd.in3d.spot": {
			"source": "iana",
			"extensions": ["spot"]
		},
		"text/vnd.iptc.newsml": { "source": "iana" },
		"text/vnd.iptc.nitf": { "source": "iana" },
		"text/vnd.latex-z": { "source": "iana" },
		"text/vnd.motorola.reflex": { "source": "iana" },
		"text/vnd.ms-mediapackage": { "source": "iana" },
		"text/vnd.net2phone.commcenter.command": { "source": "iana" },
		"text/vnd.radisys.msml-basic-layout": { "source": "iana" },
		"text/vnd.senx.warpscript": { "source": "iana" },
		"text/vnd.si.uricatalogue": { "source": "iana" },
		"text/vnd.sosi": { "source": "iana" },
		"text/vnd.sun.j2me.app-descriptor": {
			"source": "iana",
			"charset": "UTF-8",
			"extensions": ["jad"]
		},
		"text/vnd.trolltech.linguist": {
			"source": "iana",
			"charset": "UTF-8"
		},
		"text/vnd.wap.si": { "source": "iana" },
		"text/vnd.wap.sl": { "source": "iana" },
		"text/vnd.wap.wml": {
			"source": "iana",
			"extensions": ["wml"]
		},
		"text/vnd.wap.wmlscript": {
			"source": "iana",
			"extensions": ["wmls"]
		},
		"text/vtt": {
			"source": "iana",
			"charset": "UTF-8",
			"compressible": true,
			"extensions": ["vtt"]
		},
		"text/x-asm": {
			"source": "apache",
			"extensions": ["s", "asm"]
		},
		"text/x-c": {
			"source": "apache",
			"extensions": [
				"c",
				"cc",
				"cxx",
				"cpp",
				"h",
				"hh",
				"dic"
			]
		},
		"text/x-component": {
			"source": "nginx",
			"extensions": ["htc"]
		},
		"text/x-fortran": {
			"source": "apache",
			"extensions": [
				"f",
				"for",
				"f77",
				"f90"
			]
		},
		"text/x-gwt-rpc": { "compressible": true },
		"text/x-handlebars-template": { "extensions": ["hbs"] },
		"text/x-java-source": {
			"source": "apache",
			"extensions": ["java"]
		},
		"text/x-jquery-tmpl": { "compressible": true },
		"text/x-lua": { "extensions": ["lua"] },
		"text/x-markdown": {
			"compressible": true,
			"extensions": ["mkd"]
		},
		"text/x-nfo": {
			"source": "apache",
			"extensions": ["nfo"]
		},
		"text/x-opml": {
			"source": "apache",
			"extensions": ["opml"]
		},
		"text/x-org": {
			"compressible": true,
			"extensions": ["org"]
		},
		"text/x-pascal": {
			"source": "apache",
			"extensions": ["p", "pas"]
		},
		"text/x-processing": {
			"compressible": true,
			"extensions": ["pde"]
		},
		"text/x-sass": { "extensions": ["sass"] },
		"text/x-scss": { "extensions": ["scss"] },
		"text/x-setext": {
			"source": "apache",
			"extensions": ["etx"]
		},
		"text/x-sfv": {
			"source": "apache",
			"extensions": ["sfv"]
		},
		"text/x-suse-ymp": {
			"compressible": true,
			"extensions": ["ymp"]
		},
		"text/x-uuencode": {
			"source": "apache",
			"extensions": ["uu"]
		},
		"text/x-vcalendar": {
			"source": "apache",
			"extensions": ["vcs"]
		},
		"text/x-vcard": {
			"source": "apache",
			"extensions": ["vcf"]
		},
		"text/xml": {
			"source": "iana",
			"compressible": true,
			"extensions": ["xml"]
		},
		"text/xml-external-parsed-entity": { "source": "iana" },
		"text/yaml": {
			"compressible": true,
			"extensions": ["yaml", "yml"]
		},
		"video/1d-interleaved-parityfec": { "source": "iana" },
		"video/3gpp": {
			"source": "iana",
			"extensions": ["3gp", "3gpp"]
		},
		"video/3gpp-tt": { "source": "iana" },
		"video/3gpp2": {
			"source": "iana",
			"extensions": ["3g2"]
		},
		"video/av1": { "source": "iana" },
		"video/bmpeg": { "source": "iana" },
		"video/bt656": { "source": "iana" },
		"video/celb": { "source": "iana" },
		"video/dv": { "source": "iana" },
		"video/encaprtp": { "source": "iana" },
		"video/ffv1": { "source": "iana" },
		"video/flexfec": { "source": "iana" },
		"video/h261": {
			"source": "iana",
			"extensions": ["h261"]
		},
		"video/h263": {
			"source": "iana",
			"extensions": ["h263"]
		},
		"video/h263-1998": { "source": "iana" },
		"video/h263-2000": { "source": "iana" },
		"video/h264": {
			"source": "iana",
			"extensions": ["h264"]
		},
		"video/h264-rcdo": { "source": "iana" },
		"video/h264-svc": { "source": "iana" },
		"video/h265": { "source": "iana" },
		"video/iso.segment": {
			"source": "iana",
			"extensions": ["m4s"]
		},
		"video/jpeg": {
			"source": "iana",
			"extensions": ["jpgv"]
		},
		"video/jpeg2000": { "source": "iana" },
		"video/jpm": {
			"source": "apache",
			"extensions": ["jpm", "jpgm"]
		},
		"video/jxsv": { "source": "iana" },
		"video/mj2": {
			"source": "iana",
			"extensions": ["mj2", "mjp2"]
		},
		"video/mp1s": { "source": "iana" },
		"video/mp2p": { "source": "iana" },
		"video/mp2t": {
			"source": "iana",
			"extensions": ["ts"]
		},
		"video/mp4": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"mp4",
				"mp4v",
				"mpg4"
			]
		},
		"video/mp4v-es": { "source": "iana" },
		"video/mpeg": {
			"source": "iana",
			"compressible": false,
			"extensions": [
				"mpeg",
				"mpg",
				"mpe",
				"m1v",
				"m2v"
			]
		},
		"video/mpeg4-generic": { "source": "iana" },
		"video/mpv": { "source": "iana" },
		"video/nv": { "source": "iana" },
		"video/ogg": {
			"source": "iana",
			"compressible": false,
			"extensions": ["ogv"]
		},
		"video/parityfec": { "source": "iana" },
		"video/pointer": { "source": "iana" },
		"video/quicktime": {
			"source": "iana",
			"compressible": false,
			"extensions": ["qt", "mov"]
		},
		"video/raptorfec": { "source": "iana" },
		"video/raw": { "source": "iana" },
		"video/rtp-enc-aescm128": { "source": "iana" },
		"video/rtploopback": { "source": "iana" },
		"video/rtx": { "source": "iana" },
		"video/scip": { "source": "iana" },
		"video/smpte291": { "source": "iana" },
		"video/smpte292m": { "source": "iana" },
		"video/ulpfec": { "source": "iana" },
		"video/vc1": { "source": "iana" },
		"video/vc2": { "source": "iana" },
		"video/vnd.cctv": { "source": "iana" },
		"video/vnd.dece.hd": {
			"source": "iana",
			"extensions": ["uvh", "uvvh"]
		},
		"video/vnd.dece.mobile": {
			"source": "iana",
			"extensions": ["uvm", "uvvm"]
		},
		"video/vnd.dece.mp4": { "source": "iana" },
		"video/vnd.dece.pd": {
			"source": "iana",
			"extensions": ["uvp", "uvvp"]
		},
		"video/vnd.dece.sd": {
			"source": "iana",
			"extensions": ["uvs", "uvvs"]
		},
		"video/vnd.dece.video": {
			"source": "iana",
			"extensions": ["uvv", "uvvv"]
		},
		"video/vnd.directv.mpeg": { "source": "iana" },
		"video/vnd.directv.mpeg-tts": { "source": "iana" },
		"video/vnd.dlna.mpeg-tts": { "source": "iana" },
		"video/vnd.dvb.file": {
			"source": "iana",
			"extensions": ["dvb"]
		},
		"video/vnd.fvt": {
			"source": "iana",
			"extensions": ["fvt"]
		},
		"video/vnd.hns.video": { "source": "iana" },
		"video/vnd.iptvforum.1dparityfec-1010": { "source": "iana" },
		"video/vnd.iptvforum.1dparityfec-2005": { "source": "iana" },
		"video/vnd.iptvforum.2dparityfec-1010": { "source": "iana" },
		"video/vnd.iptvforum.2dparityfec-2005": { "source": "iana" },
		"video/vnd.iptvforum.ttsavc": { "source": "iana" },
		"video/vnd.iptvforum.ttsmpeg2": { "source": "iana" },
		"video/vnd.motorola.video": { "source": "iana" },
		"video/vnd.motorola.videop": { "source": "iana" },
		"video/vnd.mpegurl": {
			"source": "iana",
			"extensions": ["mxu", "m4u"]
		},
		"video/vnd.ms-playready.media.pyv": {
			"source": "iana",
			"extensions": ["pyv"]
		},
		"video/vnd.nokia.interleaved-multimedia": { "source": "iana" },
		"video/vnd.nokia.mp4vr": { "source": "iana" },
		"video/vnd.nokia.videovoip": { "source": "iana" },
		"video/vnd.objectvideo": { "source": "iana" },
		"video/vnd.radgamettools.bink": { "source": "iana" },
		"video/vnd.radgamettools.smacker": { "source": "iana" },
		"video/vnd.sealed.mpeg1": { "source": "iana" },
		"video/vnd.sealed.mpeg4": { "source": "iana" },
		"video/vnd.sealed.swf": { "source": "iana" },
		"video/vnd.sealedmedia.softseal.mov": { "source": "iana" },
		"video/vnd.uvvu.mp4": {
			"source": "iana",
			"extensions": ["uvu", "uvvu"]
		},
		"video/vnd.vivo": {
			"source": "iana",
			"extensions": ["viv"]
		},
		"video/vnd.youtube.yt": { "source": "iana" },
		"video/vp8": { "source": "iana" },
		"video/vp9": { "source": "iana" },
		"video/webm": {
			"source": "apache",
			"compressible": false,
			"extensions": ["webm"]
		},
		"video/x-f4v": {
			"source": "apache",
			"extensions": ["f4v"]
		},
		"video/x-fli": {
			"source": "apache",
			"extensions": ["fli"]
		},
		"video/x-flv": {
			"source": "apache",
			"compressible": false,
			"extensions": ["flv"]
		},
		"video/x-m4v": {
			"source": "apache",
			"extensions": ["m4v"]
		},
		"video/x-matroska": {
			"source": "apache",
			"compressible": false,
			"extensions": [
				"mkv",
				"mk3d",
				"mks"
			]
		},
		"video/x-mng": {
			"source": "apache",
			"extensions": ["mng"]
		},
		"video/x-ms-asf": {
			"source": "apache",
			"extensions": ["asf", "asx"]
		},
		"video/x-ms-vob": {
			"source": "apache",
			"extensions": ["vob"]
		},
		"video/x-ms-wm": {
			"source": "apache",
			"extensions": ["wm"]
		},
		"video/x-ms-wmv": {
			"source": "apache",
			"compressible": false,
			"extensions": ["wmv"]
		},
		"video/x-ms-wmx": {
			"source": "apache",
			"extensions": ["wmx"]
		},
		"video/x-ms-wvx": {
			"source": "apache",
			"extensions": ["wvx"]
		},
		"video/x-msvideo": {
			"source": "apache",
			"extensions": ["avi"]
		},
		"video/x-sgi-movie": {
			"source": "apache",
			"extensions": ["movie"]
		},
		"video/x-smv": {
			"source": "apache",
			"extensions": ["smv"]
		},
		"x-conference/x-cooltalk": {
			"source": "apache",
			"extensions": ["ice"]
		},
		"x-shader/x-fragment": { "compressible": true },
		"x-shader/x-vertex": { "compressible": true }
	};
}));
//#endregion
//#region node_modules/mime-db/index.js
var require_mime_db = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/*!
	* mime-db
	* Copyright(c) 2014 Jonathan Ong
	* Copyright(c) 2015-2022 Douglas Christopher Wilson
	* MIT Licensed
	*/
	/**
	* Module exports.
	*/
	module.exports = (init_db(), __toCommonJS(db_exports).default);
}));
//#endregion
//#region node_modules/ext-list/index.js
var require_ext_list = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var mimeDb = require_mime_db();
	module.exports = function() {
		var ret = {};
		Object.keys(mimeDb).forEach(function(x) {
			var val = mimeDb[x];
			if (val.extensions && val.extensions.length > 0) val.extensions.forEach(function(y) {
				ret[y] = x;
			});
		});
		return ret;
	};
}));
//#endregion
//#region node_modules/is-plain-obj/index.js
var require_is_plain_obj = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var toString = Object.prototype.toString;
	module.exports = function(x) {
		var prototype;
		return toString.call(x) === "[object Object]" && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
	};
}));
//#endregion
//#region node_modules/sort-keys/index.js
var require_sort_keys = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isPlainObj = require_is_plain_obj();
	module.exports = function(obj, opts) {
		if (!isPlainObj(obj)) throw new TypeError("Expected a plain object");
		opts = opts || {};
		if (typeof opts === "function") opts = { compare: opts };
		var deep = opts.deep;
		var seenInput = [];
		var seenOutput = [];
		var sortKeys = function(x) {
			var seenIndex = seenInput.indexOf(x);
			if (seenIndex !== -1) return seenOutput[seenIndex];
			var ret = {};
			var keys = Object.keys(x).sort(opts.compare);
			seenInput.push(x);
			seenOutput.push(ret);
			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				var val = x[key];
				ret[key] = deep && isPlainObj(val) ? sortKeys(val) : val;
			}
			return ret;
		};
		return sortKeys(obj);
	};
}));
//#endregion
//#region node_modules/sort-keys-length/index.js
var require_sort_keys_length = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var sortKeys = require_sort_keys();
	/**
	* Sort object keys by length
	*
	* @param obj
	* @api public
	*/
	module.exports.desc = function(obj) {
		return sortKeys(obj, function(a, b) {
			return b.length - a.length;
		});
	};
	module.exports.asc = function(obj) {
		return sortKeys(obj, function(a, b) {
			return a.length - b.length;
		});
	};
}));
//#endregion
//#region node_modules/electron-dl/index.js
var import_ext_name = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var extList = require_ext_list();
	var sortKeysLength = require_sort_keys_length();
	module.exports = (str) => {
		const obj = sortKeysLength.desc(extList());
		const exts = Object.keys(obj).filter((x) => str.endsWith(x));
		if (exts.length === 0) return [];
		return exts.map((x) => ({
			ext: x,
			mime: obj[x]
		}));
	};
	module.exports.mime = (str) => {
		const obj = sortKeysLength.desc(extList());
		const exts = Object.keys(obj).filter((x) => obj[x] === str);
		if (exts.length === 0) return [];
		return exts.map((x) => ({
			ext: x,
			mime: obj[x]
		}));
	};
})))(), 1);
var CancelError = class extends Error {};
var getFilenameFromMime = (name, mime) => {
	const extensions = import_ext_name.default.mime(mime);
	if (extensions.length !== 1) return name;
	return `${name}.${extensions[0].ext}`;
};
function registerListener(session, options, callback = () => {}) {
	const downloadItems = /* @__PURE__ */ new Set();
	let receivedBytes = 0;
	let completedBytes = 0;
	let totalBytes = 0;
	const activeDownloadItems = () => downloadItems.size;
	const progressDownloadItems = () => receivedBytes / totalBytes;
	options = {
		showBadge: true,
		showProgressBar: true,
		...options
	};
	const listener = (event, item, webContents) => {
		downloadItems.add(item);
		totalBytes += item.getTotalBytes();
		const window_ = BrowserWindow.fromWebContents(webContents);
		if (!window_) throw new Error("Failed to get window from web contents.");
		if (options.directory && !path.isAbsolute(options.directory)) throw new Error("The `directory` option must be an absolute path");
		const directory = options.directory ?? app.getPath("downloads");
		let filePath;
		if (options.filename) filePath = path.join(directory, options.filename);
		else {
			const filename = item.getFilename();
			const name = path.extname(filename) ? filename : getFilenameFromMime(filename, item.getMimeType());
			filePath = options.overwrite ? path.join(directory, name) : unusedFilenameSync(path.join(directory, name));
		}
		const errorMessage = options.errorMessage ?? "The download of {filename} was interrupted";
		if (options.saveAs) item.setSaveDialogOptions({
			defaultPath: filePath,
			...options.dialogOptions
		});
		else item.setSavePath(filePath);
		item.on("updated", () => {
			receivedBytes = completedBytes;
			for (const item of downloadItems) receivedBytes += item.getReceivedBytes();
			if (options.showBadge && ["darwin", "linux"].includes(process$1.platform)) app.badgeCount = activeDownloadItems();
			if (!window_.isDestroyed() && options.showProgressBar) window_.setProgressBar(progressDownloadItems());
			if (typeof options.onProgress === "function") {
				const itemTransferredBytes = item.getReceivedBytes();
				const itemTotalBytes = item.getTotalBytes();
				options.onProgress({
					percent: itemTotalBytes ? itemTransferredBytes / itemTotalBytes : 0,
					transferredBytes: itemTransferredBytes,
					totalBytes: itemTotalBytes
				});
			}
			if (typeof options.onTotalProgress === "function") options.onTotalProgress({
				percent: progressDownloadItems(),
				transferredBytes: receivedBytes,
				totalBytes
			});
		});
		item.on("done", (event, state) => {
			completedBytes += item.getTotalBytes();
			downloadItems.delete(item);
			if (options.showBadge && ["darwin", "linux"].includes(process$1.platform)) app.badgeCount = activeDownloadItems();
			if (!window_.isDestroyed() && !activeDownloadItems()) {
				window_.setProgressBar(-1);
				receivedBytes = 0;
				completedBytes = 0;
				totalBytes = 0;
			}
			if (options.unregisterWhenDone) session.removeListener("will-download", listener);
			if (state === "cancelled") {
				if (typeof options.onCancel === "function") options.onCancel(item);
				callback(new CancelError());
			} else if (state === "interrupted") {
				const message = pupa(errorMessage, { filename: path.basename(filePath) });
				callback(new Error(message));
			} else if (state === "completed") {
				const savePath = item.getSavePath();
				if (process$1.platform === "darwin") app.dock.downloadFinished(savePath);
				if (options.openFolderWhenDone) shell.showItemInFolder(savePath);
				if (typeof options.onCompleted === "function") options.onCompleted({
					fileName: item.getFilename(),
					filename: item.getFilename(),
					path: savePath,
					fileSize: item.getReceivedBytes(),
					mimeType: item.getMimeType(),
					url: item.getURL()
				});
				callback(null, item);
			}
		});
		if (typeof options.onStarted === "function") options.onStarted(item);
	};
	session.on("will-download", listener);
}
async function download(window_, url, options) {
	return new Promise((resolve, reject) => {
		options = {
			...options,
			unregisterWhenDone: true
		};
		registerListener(window_.webContents.session, options, (error, item) => {
			if (error) reject(error);
			else resolve(item);
		});
		window_.webContents.downloadURL(url);
	});
}
//#endregion
//#region node_modules/electron-is-dev/index.js
if (typeof electron === "string") throw new TypeError("Not running in an Electron environment!");
var { env } = process;
var isEnvSet = "ELECTRON_IS_DEV" in env;
var getFromEnv = Number.parseInt(env.ELECTRON_IS_DEV, 10) === 1;
var isDev = isEnvSet ? getFromEnv : !electron.app.isPackaged;
//#endregion
//#region node_modules/electron-context-menu/index.js
var webContents = (win) => win.webContents ?? win;
var applyTransform = (menuItem, value) => menuItem.transform ? menuItem.transform(value) : value;
var downloadFile = async (target, url, options) => {
	try {
		await download(target, url, options);
	} catch (error) {
		if (!(error instanceof CancelError)) electron.dialog.showErrorBox("Download Error", error.message);
	}
};
var writeBookmark = async (title, url) => electron.clipboard.write([new electron.ClipboardItem({
	"text/plain": url,
	"electron application/bookmark": {
		title,
		url
	}
})]);
var catchClickErrors = (click) => async (menuItem) => {
	try {
		await click(menuItem);
	} catch (error) {
		electron.dialog.showErrorBox("Error", error.message);
	}
};
var decorateMenuItem = (menuItem) => {
	menuItem.click = catchClickErrors(menuItem.click);
	return (options = {}) => {
		if (options.transform && !options.click) menuItem.transform = options.transform;
		return menuItem;
	};
};
var removeUnusedMenuItems = (menuTemplate) => {
	const menuItems = [];
	for (const menuItem of menuTemplate) {
		if (!menuItem || menuItem.visible === false || menuItem.visible === "") continue;
		if (menuItem.type === "separator" && (menuItems.length === 0 || menuItems.at(-1).type === "separator")) continue;
		menuItems.push(menuItem);
	}
	if (menuItems.at(-1)?.type === "separator") menuItems.pop();
	return menuItems;
};
var create = (win, options) => {
	const currentWebContents = webContents(win);
	const downloadTarget = { webContents: currentWebContents };
	const handleContextMenu = (event, properties) => {
		if (typeof options.shouldShowMenu === "function" && options.shouldShowMenu(event, properties) === false) return;
		const { editFlags } = properties;
		const hasText = properties.selectionText.length > 0;
		const isLink = Boolean(properties.linkURL);
		const isMisspelled = Boolean(properties.isEditable && hasText && properties.misspelledWord);
		const defaultActions = {
			separator: () => ({ type: "separator" }),
			learnSpelling: decorateMenuItem({
				id: "learnSpelling",
				label: "&Learn Spelling",
				visible: isMisspelled,
				click() {
					currentWebContents.session.addWordToSpellCheckerDictionary(properties.misspelledWord);
				}
			}),
			lookUpSelection: decorateMenuItem({
				id: "lookUpSelection",
				label: "Look Up “{selection}”",
				visible: process$1.platform === "darwin" && hasText && !isLink,
				click() {
					if (process$1.platform === "darwin") currentWebContents.showDefinitionForSelection();
				}
			}),
			searchWithGoogle: decorateMenuItem({
				id: "searchWithGoogle",
				label: "&Search with Google",
				visible: hasText,
				click() {
					const url = new URL("https://www.google.com/search");
					url.searchParams.set("q", properties.selectionText);
					electron.shell.openExternal(url.toString());
				}
			}),
			cut: decorateMenuItem({
				id: "cut",
				label: "Cu&t",
				enabled: editFlags.canCut && hasText,
				visible: properties.isEditable,
				async click(menuItem) {
					if (menuItem.transform) await electron.clipboard.writeText(menuItem.transform(properties.selectionText));
					else currentWebContents.cut();
				}
			}),
			copy: decorateMenuItem({
				id: "copy",
				label: "&Copy",
				enabled: editFlags.canCopy && hasText,
				visible: properties.isEditable || hasText,
				async click(menuItem) {
					if (menuItem.transform) await electron.clipboard.writeText(menuItem.transform(properties.selectionText));
					else currentWebContents.copy();
				}
			}),
			paste: decorateMenuItem({
				id: "paste",
				label: "&Paste",
				enabled: editFlags.canPaste,
				visible: properties.isEditable,
				async click(menuItem) {
					if (menuItem.transform) {
						const clipboardContent = await electron.clipboard.readText();
						await currentWebContents.insertText(menuItem.transform(clipboardContent));
					} else currentWebContents.paste();
				}
			}),
			selectAll: decorateMenuItem({
				id: "selectAll",
				label: "Select &All",
				click() {
					currentWebContents.selectAll();
				}
			}),
			saveImage: decorateMenuItem({
				id: "saveImage",
				label: "Save I&mage",
				visible: properties.mediaType === "image",
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL));
				}
			}),
			saveImageAs: decorateMenuItem({
				id: "saveImageAs",
				label: "Sa&ve Image As…",
				visible: properties.mediaType === "image",
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL), { saveAs: true });
				}
			}),
			saveVideo: decorateMenuItem({
				id: "saveVideo",
				label: "Save Vide&o",
				visible: properties.mediaType === "video",
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL));
				}
			}),
			saveVideoAs: decorateMenuItem({
				id: "saveVideoAs",
				label: "Sa&ve Video As…",
				visible: properties.mediaType === "video",
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL), { saveAs: true });
				}
			}),
			copyLink: decorateMenuItem({
				id: "copyLink",
				label: "Copy Lin&k",
				visible: properties.linkURL.length > 0 && properties.mediaType === "none",
				async click(menuItem) {
					await writeBookmark(properties.linkText, applyTransform(menuItem, properties.linkURL));
				}
			}),
			saveLinkAs: decorateMenuItem({
				id: "saveLinkAs",
				label: "Save Link As…",
				visible: properties.linkURL.length > 0 && properties.mediaType === "none",
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.linkURL), { saveAs: true });
				}
			}),
			copyImage: decorateMenuItem({
				id: "copyImage",
				label: "Cop&y Image",
				visible: properties.mediaType === "image",
				click() {
					currentWebContents.copyImageAt(properties.x, properties.y);
				}
			}),
			copyImageAddress: decorateMenuItem({
				id: "copyImageAddress",
				label: "C&opy Image Address",
				visible: properties.mediaType === "image",
				async click(menuItem) {
					const url = applyTransform(menuItem, properties.srcURL);
					await writeBookmark(url, url);
				}
			}),
			copyVideoAddress: decorateMenuItem({
				id: "copyVideoAddress",
				label: "Copy Video Ad&dress",
				visible: properties.mediaType === "video",
				async click(menuItem) {
					const url = applyTransform(menuItem, properties.srcURL);
					await writeBookmark(url, url);
				}
			}),
			copyVideoFrame: decorateMenuItem({
				id: "copyVideoFrame",
				label: "Copy Video Fra&me",
				visible: properties.mediaType === "video",
				click() {
					currentWebContents.copyVideoFrameAt(properties.x, properties.y);
				}
			}),
			saveVideoFrameAs: decorateMenuItem({
				id: "saveVideoFrameAs",
				label: "Save Video &Frame As…",
				visible: properties.mediaType === "video",
				click() {
					currentWebContents.saveVideoFrameAs(properties.x, properties.y);
				}
			}),
			inspect: () => ({
				id: "inspect",
				label: "I&nspect Element",
				click() {
					currentWebContents.inspectElement(properties.x, properties.y);
					currentWebContents.devToolsWebContents?.focus();
				}
			}),
			services: () => ({
				id: "services",
				label: "Services",
				role: "services",
				visible: process$1.platform === "darwin" && (properties.isEditable || hasText)
			})
		};
		const shouldShowInspectElement = options.showInspectElement ?? isDev;
		const shouldShowSelectAll = options.showSelectAll ?? process$1.platform !== "darwin";
		const dictionarySuggestions = properties.dictionarySuggestions.length > 0 ? properties.dictionarySuggestions.map((suggestion) => ({
			id: "dictionarySuggestions",
			label: suggestion,
			visible: isMisspelled,
			click(menuItem) {
				currentWebContents.replaceMisspelling(menuItem.label);
			}
		})) : [{
			id: "dictionarySuggestions",
			label: "No Guesses Found",
			visible: isMisspelled,
			enabled: false
		}];
		let menuTemplate = [
			defaultActions.separator(),
			...dictionarySuggestions,
			defaultActions.separator(),
			options.showLearnSpelling !== false && defaultActions.learnSpelling(),
			defaultActions.separator(),
			options.showLookUpSelection !== false && defaultActions.lookUpSelection(),
			defaultActions.separator(),
			options.showSearchWithGoogle !== false && defaultActions.searchWithGoogle(),
			defaultActions.separator(),
			defaultActions.cut(),
			defaultActions.copy(),
			defaultActions.paste(),
			shouldShowSelectAll && defaultActions.selectAll(),
			defaultActions.separator(),
			options.showSaveImage && defaultActions.saveImage(),
			options.showSaveImageAs && defaultActions.saveImageAs(),
			options.showCopyImage !== false && defaultActions.copyImage(),
			options.showCopyImageAddress && defaultActions.copyImageAddress(),
			options.showSaveVideo && defaultActions.saveVideo(),
			options.showSaveVideoAs && defaultActions.saveVideoAs(),
			options.showCopyVideoAddress && defaultActions.copyVideoAddress(),
			options.showCopyVideoFrame && defaultActions.copyVideoFrame(),
			options.showSaveVideoFrameAs && defaultActions.saveVideoFrameAs(),
			defaultActions.separator(),
			options.showCopyLink !== false && defaultActions.copyLink(),
			options.showSaveLinkAs && defaultActions.saveLinkAs(),
			defaultActions.separator(),
			shouldShowInspectElement && defaultActions.inspect(),
			options.showServices && defaultActions.services(),
			defaultActions.separator()
		];
		if (options.menu) {
			const result = options.menu(defaultActions, properties, win, dictionarySuggestions, event);
			if (Array.isArray(result)) menuTemplate = result;
		}
		if (options.prepend) {
			const result = options.prepend(defaultActions, properties, win, event);
			if (Array.isArray(result)) menuTemplate.unshift(...result);
		}
		if (options.append) {
			const result = options.append(defaultActions, properties, win, event);
			if (Array.isArray(result)) menuTemplate.push(...result);
		}
		menuTemplate = removeUnusedMenuItems(menuTemplate);
		for (const menuItem of menuTemplate) {
			if (options.labels && options.labels[menuItem.id]) menuItem.label = options.labels[menuItem.id];
			if (typeof menuItem.label === "string" && menuItem.label.includes("{selection}")) {
				const selectionString = typeof properties.selectionText === "string" ? properties.selectionText.trim() : "";
				menuItem.label = menuItem.label.replace("{selection}", cliTruncate(selectionString, 25).replaceAll("&", "&&"));
			}
		}
		if (menuTemplate.length > 0) {
			const menu = electron.Menu.buildFromTemplate(menuTemplate);
			if (typeof options.onShow === "function") menu.on("menu-will-show", options.onShow);
			if (typeof options.onClose === "function") menu.on("menu-will-close", options.onClose);
			menu.popup({
				window: electron.BrowserWindow.fromWebContents(currentWebContents) ?? void 0,
				frame: properties.frame ?? void 0,
				sourceType: properties.menuSourceType
			});
		}
	};
	currentWebContents.on("context-menu", handleContextMenu);
	return () => {
		currentWebContents.removeListener("context-menu", handleContextMenu);
	};
};
function contextMenu(options = {}) {
	if (process$1.type === "renderer") throw new Error("Cannot use electron-context-menu in the renderer process!");
	let isDisposed = false;
	const disposables = /* @__PURE__ */ new Set();
	const init = (win) => {
		if (isDisposed) return;
		const currentWebContents = webContents(win);
		const disposeMenu = create(win, options);
		const disposeWindow = () => {
			disposables.delete(disposeWindow);
			currentWebContents.removeListener("destroyed", disposeWindow);
			disposeMenu();
		};
		currentWebContents.once("destroyed", disposeWindow);
		disposables.add(disposeWindow);
	};
	const dispose = () => {
		for (const disposeWindow of disposables) disposeWindow();
		disposables.clear();
		isDisposed = true;
	};
	if (options.window) {
		init(options.window);
		return dispose;
	}
	for (const win of electron.BrowserWindow.getAllWindows()) init(win);
	const onWindowCreated = (event, win) => {
		init(win);
	};
	electron.app.on("browser-window-created", onWindowCreated);
	disposables.add(() => {
		electron.app.removeListener("browser-window-created", onWindowCreated);
	});
	return dispose;
}
//#endregion
//#region electron/main.ts
contextMenu({
	showSearchWithGoogle: false,
	showInspectElement: true
});
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
var RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
var win;
function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: "#ffffff",
			symbolColor: "#42526E",
			height: 31
		},
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(path.join(RENDERER_DIST, "index.html"));
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("http")) __require("electron").shell.openExternal(url);
		return { action: "deny" };
	});
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(() => {
	createWindow();
	import_main.autoUpdater.on("checking-for-update", () => {
		console.log("Checking for updates...");
	});
	import_main.autoUpdater.on("update-available", (info) => {
		console.log("Update available.", info);
	});
	import_main.autoUpdater.on("update-not-available", (info) => {
		console.log("Update not available.", info);
	});
	import_main.autoUpdater.on("error", (err) => {
		console.error("Error in auto-updater.", err);
	});
	import_main.autoUpdater.on("download-progress", (progressObj) => {
		let log_message = "Download speed: " + progressObj.bytesPerSecond;
		log_message = log_message + " - Downloaded " + progressObj.percent + "%";
		log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
		console.log(log_message);
	});
	import_main.autoUpdater.on("update-downloaded", (info) => {
		console.log("Update downloaded", info);
	});
	import_main.autoUpdater.checkForUpdatesAndNotify();
});
//#endregion
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
