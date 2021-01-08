const TinyReact = (function() {
    function createElement(type, attributes = {}, ...children) {
        const childElements = [].concat(...children).map(
            (child) => 
                child instanceof Object
                    ? child
                    : createElement("text", {
                        textContent: child
                    })
        )
        return {
            type,
            children: childElements,
            props: Object.assign({ children: childElements }, attributes)
        };
    }

    function updateDomElement(domElement, newVirtualElement, oldVirtualElement = {}) {
        const newProps = newVirtualElement.props || {};
        const oldProps = oldVirtualElement.props || {};

        // Add new props
        Object.keys(newProps).forEach(propName => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];
            if (newProp !== oldProp) {
                if (propName.slice(0, 2) === "on") {
                    // prop is an event handler
                    const eventName = propName.toLowerCase().slice(2);
                    domElement.addEventListener(eventName, newProp, false); // Disable event capturing
                    if (oldProp) {
                        domElement.removeEventListener(eventName, oldProp, false);
                    }
                } else if (propName === "value" || propName === "checked") {
                    // these are special attributes that cannot be set using setAttribute.
                    domElement[propName] = newProp;
                } else if (propName !== "children") {
                    // ignore the 'children' prop.
                    if (propName === "className") {
                        domElement.setAttribute("class", newProps[propName]);
                    } else {
                        domElement.setAttribute(propName, newProps[propName]);
                    }
                }
            }
        });

        // Remove old props
        Object.keys(oldProps).forEach(propName => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];
            if (!newProp) {
                if (propName.slice(0, 2) === "on") {
                    // event handler
                    domElement.removeEventListener(propName, oldProp, false);
                } else if (propName !== "children") {
                    domElement.removeAttribute(propName);
                }
            }
        });
    }

    const render = function (vdom, container, oldDom = container.firstChild) {
        diff(vdom, container, oldDom);
    }

    const diff = function(vdom, container, oldDom) {
        let oldvdom = oldDom && oldDom._virtualElement;
        if (!oldDom) {
            mountElement(vdom, container, oldDom);
        } else if (typeof vdom.type === "function") {
            diffComponent(vdom, null, container, oldDom);
        } else if(oldvdom && oldvdom.type === vdom.type) {
            if (oldvdom.type == "text") {
                updateTextNode(oldDom, vdom, oldvdom);
            } else {
                updateDomElement(oldDom, vdom, oldvdom);
            }

            oldDom._virtualElement = vdom;
            vdom.children.forEach((child, i) => {
                // Perform an index by index diffing (because we don't have keys yet.)
                diff(child, oldDom, oldDom.childNodes[i]);
            });

            // Remove old dom nodes
            if(oldDom.childNodes.length > vdom.children.length) {
                for (let i = oldDom.childNodes.length - 1; i >= vdom.children.length; i--) {
                    unmountNode(oldDom.childNodes[i], oldDom);
                }
            }
        }
    }

    function updateTextNode(domElement, newVirtualElement, oldVirtualElement) {
        if (newVirtualElement.props.textContent !== oldVirtualElement.props.textContent) {
            domElement.textContent = newVirtualElement.props.textContent;
        }

        domElement._virtualElement = newVirtualElement;
    }

    function diffComponent(newVirtualElement, oldComponent, container, domElement) {
        if (!oldComponent) {
            mountElement(newVirtualElement, container, domElement);
        }
    }

    const mountElement = function(vdom, container, oldDom) {
        if (typeof vdom.type === "function") {
            return mountComponent(vdom, container, oldDom);
        } else {
            return mountSimpleNode(vdom, container, oldDom);
        }
    }

    const mountComponent = function(vdom, container, oldDom) {
        let nextvDom = null, component = null, newDomElement = null;
        if (isFunctionalComponent(vdom)) {
            nextvDom = buildFunctionalComponent(vdom);
        }

        if (isFunction(nextvDom)) {
            return mountComponent(nextvDom, container, oldDom);
        } else {
            newDomElement = mountElement(nextvDom, container, oldDom);
        }

        return newDomElement;
    }

    function isFunction(obj) {
        return obj && "function" === typeof obj.type;
    }

    function isFunctionalComponent(vnode) {
        let nodeType = vnode && vnode.type;
        return nodeType && isFunction(vnode) 
            && !(nodeType.prototype && nodeType.prototype.render);
    }
    
    function buildFunctionalComponent(vnode, context) {
        return vnode.type(vnode.props || {});
    }

    const mountSimpleNode = function(vdom, container, oldDom, parentComponent) {
        let newDomElement = null;
        const nextSibling = oldDom && oldDom.nextSibling;

        if (vdom.type === "text") {
            newDomElement = document.createTextNode(vdom.props.textContent);
        } else {
            newDomElement = document.createElement(vdom.type);
            updateDomElement(newDomElement, vdom);
        }

        // Set reference to vdom to dom.
        newDomElement._virtualElement = vdom;

        if (oldDom) {
            unmountNode(oldDom, parentComponent);
        }

        if (nextSibling) {
            container.insertBefore(newDomElement, nextSibling);
        } else {
            container.appendChild(newDomElement);
        }

        // Render each child element recursively.
        vdom.children.forEach(c => mountElement(c, newDomElement));
    }

    function unmountNode(domElement, parentComponent) {
        domElement.remove();
    }

    return {
        createElement,
        render
    };
}());