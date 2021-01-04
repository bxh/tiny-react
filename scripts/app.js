/** @jsx TinyReact.createElement */

/** The param directive above instructs Babel to use TinyReact.createElement when transpiling the code. */

const root = document.getElementById("root");

var before = (
    <div>
        <h1>Hello Tiny React</h1>
        <div className="text" >nested</div>
        <span>this is to become red.</span>
        <button onClick={() => alert("Hi")}>click Me!</button>
        <span>this is to be deleted.</span>
    </div>
);


TinyReact.render(before, root);

var after = (
    <div>
        <h1>Hello Tiny React 2</h1>
        <div className="text" >nested</div>
        <span style="color:red">this is to become red.</span>
        <button onClick={() => alert("Hi")}>click Me Again!</button>
    </div>
);

setTimeout(() => {TinyReact.render(after, root)}, 5000);