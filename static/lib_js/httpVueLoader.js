
//原著:Copyright (c) 2017 Franck Freiburger
//https://www.npmjs.com/package/http-vue-loader
//修改:Copyright (c) 2022 baili@superliii.com 
//许可:MIT
//修复:增加了对vue文件组件大写标签支持

(function umd(root, factory) {
	if (typeof module === 'object' && typeof exports === 'object')
		module.exports = factory()
	else if (typeof define === 'function' && define.amd)
		define([], factory)
	else
		root.httpVueLoader = factory()
})(this, function factory() {
	'use strict';
	//console.log("[httpVueLoader]factory()");
	var scopeIndex = 0;

	StyleContext.prototype = {
		withBase: function (callback) {
			var tmpBaseElt;
			if (this.component.baseURI) {
				// firefox and chrome need the <base> to be set while inserting or modifying <style> in a document.
				tmpBaseElt = document.createElement('base');
				tmpBaseElt.href = this.component.baseURI;
				var headElt = this.component.getHead();
				headElt.insertBefore(tmpBaseElt, headElt.firstChild);
			}
			callback.call(this);
			if (tmpBaseElt)
				this.component.getHead().removeChild(tmpBaseElt);
		},

		scopeStyles: function (styleElt, scopeName) {
			function process() {
				var sheet = styleElt.sheet;
				var rules = sheet.cssRules;
				for (var i = 0; i < rules.length; ++i) {
					var rule = rules[i];
					if (rule.type !== 1) continue;

					var scopedSelectors = [];
					rule.selectorText.split(/\s*,\s*/).forEach(function (sel) {
						scopedSelectors.push(scopeName + ' ' + sel);
						var segments = sel.match(/([^ :]+)(.+)?/);
						scopedSelectors.push(segments[1] + scopeName + (segments[2] || ''));
					});

					var scopedRule = scopedSelectors.join(',') + rule.cssText.substr(rule.selectorText.length);
					sheet.deleteRule(i);
					sheet.insertRule(scopedRule, i);
				}
			}

			try {
				// firefox may fail sheet.cssRules with InvalidAccessError
				process();
			} catch (ex) {
				if (ex instanceof DOMException && ex.code === DOMException.INVALID_ACCESS_ERR) {
					styleElt.sheet.disabled = true;
					styleElt.addEventListener('load', function onStyleLoaded() {
						styleElt.removeEventListener('load', onStyleLoaded);
						// firefox need this timeout otherwise we have to use document.importNode(style, true)
						setTimeout(function () {
							process();
							styleElt.sheet.disabled = false;
						});
					});
					return;
				}
				throw ex;
			}
		},

		compile: function () {
			var hasTemplate = this.template !== null;
			var scoped = this.elt.hasAttribute('scoped');
			if (scoped) {
				// no template, no scopable style needed
				if (!hasTemplate) return;

				// firefox does not tolerate this attribute
				this.elt.removeAttribute('scoped');
			}

			this.withBase(function () {
				//将css插入到head中
				this.component.getHead().appendChild(this.elt);
				//console.log("withBase() getHead", this.component.getHead());
			});

			//如果是scoped,给上面添加的style里面的每个样式,添加个当前组件的唯一id
			if (scoped)
				this.scopeStyles(this.elt, '[' + this.component.getScopeId() + ']');

			return Promise.resolve();
		},

		getContent: function () {

			return this.elt.textContent;
		},

		setContent: function (content) {

			this.withBase(function () {

				this.elt.textContent = content;
			});
		}
	};

	function StyleContext(component, elt) {

		this.component = component;
		this.elt = elt;
	}


	ScriptContext.prototype = {
		getContent: function () {
			return this.elt.textContent;
		},

		setContent: function (content) {
			this.elt.textContent = content;
		},

		//构建??看上去是把当前的script对象exports出去,绑定到window上
		compile: function (module) {
			var childModuleRequire = function (childURL) {
				return httpVueLoader.require(resolveURL(this.component.baseURI, childURL));
			}.bind(this);

			var childLoader = function (childURL, childName) {
				return httpVueLoader(resolveURL(this.component.baseURI, childURL), childName);
			}.bind(this);

			try {
				Function('exports', 'require', 'httpVueLoader', 'module', this.getContent()).call(this.module.exports, this.module.exports, childModuleRequire, childLoader, this.module);
			} catch (ex) {
				if (!('lineNumber' in ex)) {
					return Promise.reject(ex);
				}
				var vueFileData = responseText.replace(/\r?\n/g, '\n');
				var lineNumber = vueFileData.substr(0, vueFileData.indexOf(script)).split('\n').length + ex.lineNumber - 1;
				throw new (ex.constructor)(ex.message, url, lineNumber);
			}

			return Promise.resolve(this.module.exports)
				.then(httpVueLoader.scriptExportsHandler.bind(this))
				.then(function (exports) {
					this.module.exports = exports;
				}.bind(this));
		}
	};

	function ScriptContext(component, elt) {

		this.component = component;
		this.elt = elt;
		this.module = { exports: {} };
	}


	TemplateContext.prototype = {
		//我们对这个函数进行了改造
		getContent: function () {
			//改造前:
			//我们不能使用innerHTML返回template,因为它会将标签全部转为小写
			//这对vue组件来说非常不友好,比如iview的组件库都是通过大小写区分的
			//我们需要返回原始的template文本片段
			//return this.elt.innerHTML;


			//改造后:
			//我们不能使用jsdom或cheerio之类的库去提取
			//它们一样会把标签转为小写,具体原因大概都是用了沙盒解析的方式吧...
			//本来想用正则来匹配template字段的,但本人不才没玩明白
			//这里简单粗暴的用indexOf来解决问题吧
			let vue_html = this.component.responseText;//这是我们之前寄存的vue文件原始文本
			//console.log("[TemplateContext]getContent", vue_html);
			let ret_vue = this.removeTag('script', vue_html)
			ret_vue = this.removeTag('style', ret_vue)
			//把template标签干掉,保留内容
			let a = ret_vue.indexOf(">");
			let b = ret_vue.lastIndexOf("<");
			ret_vue = ret_vue.substring(a + 1, b).trim();
			//console.log(ret_vue);
			return ret_vue;
		},
		//我们添加的方法,用以移除根标签内容
		removeTag(tag, code) {
			let a = code.indexOf(`<${tag}`);
			let b = code.lastIndexOf(`</${tag}`);
			let ret = code.replace(code.substring(a, code.indexOf(">", b) + 1), "");
			return ret;
		},
		setContent: function (content) {
			this.elt.innerHTML = content;
		},

		getRootElt: function () {
			var tplElt = this.elt.content || this.elt;
			if ('firstElementChild' in tplElt)
				return tplElt.firstElementChild;
			for (tplElt = tplElt.firstChild; tplElt !== null; tplElt = tplElt.nextSibling)
				if (tplElt.nodeType === Node.ELEMENT_NODE)
					return tplElt;
			return null;
		},

		compile: function () {
			//console.log("[TemplateContext]compile", this.getContent());
			return Promise.resolve();
		}
	};

	function TemplateContext(component, elt) {
		this.component = component;
		this.elt = elt;
	}



	Component.prototype = {
		getHead: function () {
			return document.head || document.getElementsByTagName('head')[0];
		},

		getScopeId: function () {
			if (this._scopeId === '') {
				this._scopeId = 'data-s-' + (scopeIndex++).toString(36);
				this.template.getRootElt().setAttribute(this._scopeId, '');
			}
			return this._scopeId;
		},

		//从url加载组件,随后利用浏览器分离template,script,style,然后将数据绑定到当前component上
		load: function (componentURL) {
			//用XMLHttpRequest从url加载组件,返回promise
			return httpVueLoader.httpRequest(componentURL)
				.then(function (responseText) {
					//console.log("[http-vue-loader]responseText", responseText);
					//responseText是加载回来的vue组件文本
					//我们将其寄存起来,以便后续getContent的时候使用
					this.responseText = responseText;



					this.baseURI = componentURL.substr(0, componentURL.lastIndexOf('/') + 1);
					//console.log("this.baseURI", this.baseURI);
					//console.log("responseText", responseText);


					//让浏览器创建一个虚拟document,这个document的内容不会影响页面
					//https://developer.mozilla.org/zh-CN/docs/Web/API/Document/implementation
					//https://blog.csdn.net/ISaiSai/article/details/77915517#:~:text=DOM%20Implementation%20createHTMLDocument%20%28%29%E6%96%B9%E6%B3%95%E7%94%A8%E4%BA%8E%20%E5%88%9B%E5%BB%BA%E6%96%B0%20%E7%9A%84%20HTML%20%E6%96%87%E6%A1%A3%E3%80%82,nal%29%3A%E5%AE%83%E6%98%AF%E4%B8%80%E4%B8%AADOMString%EF%BC%8C%E5%85%B6%E4%B8%AD%E5%8C%85%E5%90%AB%E8%A6%81%E7%94%A8%E4%BA%8E%20%E6%96%B0HTML%20%E6%96%87%E6%A1%A3%E7%9A%84%E6%A0%87%E9%A2%98%E3%80%82%20%E8%BF%94%E5%9B%9E%E5%80%BC%EF%BC%9A%E6%AD%A4%E5%87%BD%E6%95%B0%E8%BF%94%E5%9B%9E%20%E5%88%9B%E5%BB%BA%20%E7%9A%84%20HTML%20%E6%96%87%E6%A1%A3%E3%80%82
					var doc = document.implementation.createHTMLDocument('');

					// IE requires the <base> to come with <style>
					// IE 需要 <base> 来搭配 <style> 不好意思不懂
					let vue_html = (this.baseURI ? '<base href="' + this.baseURI + '">' : '') + responseText;
					//console.log("vue_html", vue_html);

					//将vue文件内容填充到虚拟document中
					//这个做法十分巧妙,利用浏览器来解析html对象...
					//但是这里有个问题,直接使用innerHTML会导致大写的标签自动转为小写
					//所以我们在编写外部组件的时候,组件命名应该顿寻W3C标准(字母全小写且必须包含一个连字符)
					//这会帮助我们避免和当前以及未来的 HTML 元素相冲突。
					//https://cn.vuejs.org/v2/guide/components-registration.html#%E7%BB%84%E4%BB%B6%E5%90%8D
					doc.body.innerHTML = vue_html;
					//console.log("[http-vue-loader]responseText", vue_html, doc.body.innerHTML);
					//我们改造了TemplateContext.getContent()方法,让给vue的template数据不再是经过小写处理的文本



					//遍历页面所有元素,找到刚才添加的vue代码片段(for还能这么用....)
					//浏览器标签不区分大小写,所以下面的大写无所谓,看得舒服就行...
					for (var it = doc.body.firstChild; it; it = it.nextSibling) {
						switch (it.nodeName) {
							case 'TEMPLATE':
								//这里的it是指当前template代码
								//console.log("it", it)
								this.template = new TemplateContext(this, it);
								//console.log("this.template", this.template);
								break;
							case 'SCRIPT':
								this.script = new ScriptContext(this, it);
								//console.log("this.script", this.script);
								break;
							case 'STYLE':
								this.styles.push(new StyleContext(this, it));
								//console.log("this.styles", this.styles);
								break;
						}
					}
					return this;
					//下面的bind函数将this绑定到了主component对象上
				}.bind(this));
		},

		//标准化代码???这整个函数都没看明白在干啥...
		_normalizeSection: function (eltCx) {
			//如果这个组件有src属性,则请求src随后移除src属性
			//看上去这像是遍历加载子组件...
			//解决嵌套问题??
			var p;
			if (eltCx === null || !eltCx.elt.hasAttribute('src')) {
				p = Promise.resolve(null);
			} else {
				p = httpVueLoader.httpRequest(eltCx.elt.getAttribute('src'))
					.then(function (content) {
						eltCx.elt.removeAttribute('src');
						return content;
					});
			}
			return p
				.then(function (content) {
					//这里的lang指的是html/js/css
					//返回html/js/css????暂时不知道是干什么用的
					//console.log("content", content);
					if (eltCx !== null && eltCx.elt.hasAttribute('lang')) {
						var lang = eltCx.elt.getAttribute('lang');
						//console.log("lang", lang);
						eltCx.elt.removeAttribute('lang');
						return httpVueLoader.langProcessor[lang.toLowerCase()].call(this, content === null ? eltCx.getContent() : content);
					}
					return content;
				}.bind(this))
				.then(function (content) {
					//console.log("then content", content)
					if (content !== null)
						eltCx.setContent(content);
				});
		},

		normalize: function () {
			return Promise.all(Array.prototype.concat(
				this._normalizeSection(this.template),
				this._normalizeSection(this.script),
				this.styles.map(this._normalizeSection)
			)).then(function () {
				return this;
			}.bind(this));
		},


		compile: function () {
			return Promise.all(Array.prototype.concat(
				//template:啥也不干
				this.template && this.template.compile(),
				//js:绑定到window上
				this.script && this.script.compile(),
				//css:添加到head上并且判断是否为scoped,随后进行处理
				this.styles.map(function (style) {
					//console.log("compile style", style);
					return style.compile();
				})
			)).then(function () {
				return this;
			}.bind(this));
		}
	};

	//定义一个组件的基本数据
	function Component(name) {
		this.name = name;
		this.template = null;
		this.script = null;
		this.styles = [];
		this._scopeId = '';
	}

	function identity(value) {

		return value;
	}

	//解析组件URL地址,得到vue文件名称和补全的地址
	function parseComponentURL(url) {
		var comp = url.match(/(.*?)([^/]+?)\/?(\.vue)?(\?.*|#.*|$)/);
		return {
			name: comp[2],
			url: comp[1] + comp[2] + (comp[3] === undefined ? '/index.vue' : comp[3]) + comp[4]
		};
	}

	function resolveURL(baseURL, url) {

		if (url.substr(0, 2) === './' || url.substr(0, 3) === '../') {
			return baseURL + url;
		}
		return url;
	}

	//httpVueLoader()=>
	//这份代码我研究完以后我受益匪浅....
	//作者加拿大的貌似,说到加拿大我就联想到了那个作死玩高压电的罗兹大哥..
	httpVueLoader.load = function (url, name) {
		return function () {
			//从url加载vue文件然后加载到虚拟dom上
			return new Component(name).load(url)
				.then(function (component) {
					//标准化代码??没搞懂在干啥
					//console.log('load then 1', component);
					return component.normalize();
				})
				.then(function (component) {
					//构建这个组件
					//将html js css等代码 根据不同的特性,添加到页面的不同部分
					return component.compile();
				})
				.then(function (component) {
					var exports = component.script !== null ? component.script.module.exports : {};
					if (component.template !== null)
						//这里是将浏览器跑完的虚拟html export出去
						//随后vue会加载这个template
						//我们需要对getContent这个函数进行改造以解决大小写问题
						exports.template = component.template.getContent();
					if (exports.name === undefined)
						if (component.name !== undefined)
							exports.name = component.name;
					exports._baseURI = component.baseURI;
					return exports;
				});
		};
	};


	httpVueLoader.register = function (Vue, url) {

		var comp = parseComponentURL(url);
		Vue.component(comp.name, httpVueLoader.load(comp.url));
	};

	httpVueLoader.install = function (Vue) {

		Vue.mixin({

			beforeCreate: function () {

				var components = this.$options.components;

				for (var componentName in components) {

					if (typeof (components[componentName]) === 'string' && components[componentName].substr(0, 4) === 'url:') {

						var comp = parseComponentURL(components[componentName].substr(4));

						var componentURL = ('_baseURI' in this.$options) ? resolveURL(this.$options._baseURI, comp.url) : comp.url;

						if (isNaN(componentName))
							components[componentName] = httpVueLoader.load(componentURL, componentName);
						else
							components[componentName] = Vue.component(comp.name, httpVueLoader.load(componentURL, comp.name));
					}
				}
			}
		});
	};

	httpVueLoader.require = function (moduleName) {
		return window[moduleName];
	};

	//用XMLHttpRequest从url加载组件,返回promise
	httpVueLoader.httpRequest = function (url) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.responseType = 'text';
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if (xhr.status >= 200 && xhr.status < 300)
						resolve(xhr.responseText);
					else
						reject(xhr.status);
				}
			};
			xhr.send(null);
		});
	};

	httpVueLoader.langProcessor = {
		html: identity,
		js: identity,
		css: identity
	};

	httpVueLoader.scriptExportsHandler = identity;

	function httpVueLoader(url, name) {
		//从url解析组件名和补全的地址
		var comp = parseComponentURL(url);
		return httpVueLoader.load(comp.url, name);
	}

	return httpVueLoader;
});

