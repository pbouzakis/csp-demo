"use strict";

let console = require("consoleit")("log");
let { chan, go, timeout, take, put, putAsync } = require("js-csp");

const NETWORK_LATENCY = 2000;

// MODEL //////////////////////////////////////////////////

let createUser = () => { 
  return { name: "pbo", email: "me@pbo.com" } 
};

let fetchUser = () => {
  let ch = chan();

  console.log("Fetching user...");

  setTimeout(() => {
      let user = createUser();
      console.log("We got the user! ", user);
      putAsync(ch, user);
  }, NETWORK_LATENCY);
  
  return ch;
};

// UI /////////////////////////////////////////////////////

let createInputUI = (delegate) => {
    var tpl = document.getElementById("input-prompt-tpl");
    var el, inp, btn;

    let attach = (parent = document.body) => {
        let frag = document.importNode(tpl.content, true);
        el = frag.firstElementChild;
        inp = frag.querySelector("input");
        btn = frag.querySelector("button");

        btn.addEventListener("click", submit);
        parent.appendChild(frag);
    };

    let detach = () => {
        el.parentElement.removeChild(el);
        btn.removeEventListener("click", submit);
    };
    
    let submit = () => {
        delegate.onValueChange(inp.value);
    };

    return { attach, detach };
}

let promptForValue = () => {
    var ch = chan();
    console.log("Prompting...")

    let inputUI = createInputUI({
        onValueChange(val) {
            console.log("Input recieved from UI");
            inputUI.detach();
            putAsync(ch, val);      
        }
    });

    inputUI.attach();
    return ch;
};

// APP PLUGINS ////////////////////////////////////////////

function* fooAuthPlugin(ch) {
    console.log("Plugin: foo INIT");
    
    // Actual work: augment user w/ foo.
    var user = yield take(ch);
    user.foo = { color: "blue", size: 100 };

    console.log("Plugin: foo PUT");
    yield put(ch, user);
    console.log("Plugin: foo END");
}

function* descriptionPlugin(ch) {
    console.log("Plugin: description INIT");
    let user = yield take(ch);

    // Prompt user for description
    user.description  = yield promptForValue();

    console.log("Plugin: description PUT");
    yield put(ch, user);
    console.log("Plugin: descrioption END");
}

// APP ////////////////////////////////////////////////////

function* app() {
    console.log("INIT APP");
    let ch = chan();

    [fooAuthPlugin, descriptionPlugin]
        .forEach((plugin) => go(plugin, [ch]));

    console.log("START APP");

    let user = yield fetchUser();
    yield put(ch, user);
    user = yield take(ch);

    console.log("USER: ", user, "END APP");
    ch.close();
};

go(app);
