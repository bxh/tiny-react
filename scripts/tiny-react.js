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

    const mountElement = function(vdom, container, oldDom) {
        return mountSimpleNode(vdom, container, oldDom);
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