Ember.TEMPLATES["application"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', stack1, hashTypes, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  data.buffer.push("\n                <ul class=\"nav\">\n                    <li><a href=\"#/principals/user\">Users</a></li>\n                    <li><a href=\"#/principals/device\">Devices</a></li>\n                    <li><a href=\"#/messages\">Messages</a></li>\n                </ul>\n                ");
  }

function program3(depth0,data) {
  
  var buffer = '', hashTypes;
  data.buffer.push("\n                        <li><a>");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "App.user.name", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("</a></li>\n                        <li><a ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "signout", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("> Sign Out </a></li>\n                    ");
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = '', stack1, stack2, hashTypes, options;
  data.buffer.push("\n                        <li>");
  hashTypes = {};
  options = {hash:{},inverse:self.noop,fn:self.program(6, program6, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data};
  stack2 = ((stack1 = helpers.linkTo),stack1 ? stack1.call(depth0, "user.create", options) : helperMissing.call(depth0, "linkTo", "user.create", options));
  if(stack2 || stack2 === 0) { data.buffer.push(stack2); }
  data.buffer.push("</li>\n                        <li>");
  hashTypes = {};
  options = {hash:{},inverse:self.noop,fn:self.program(8, program8, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data};
  stack2 = ((stack1 = helpers.linkTo),stack1 ? stack1.call(depth0, "user.login", options) : helperMissing.call(depth0, "linkTo", "user.login", options));
  if(stack2 || stack2 === 0) { data.buffer.push(stack2); }
  data.buffer.push("</li>\n                    ");
  return buffer;
  }
function program6(depth0,data) {
  
  
  data.buffer.push(" Get Started ");
  }

function program8(depth0,data) {
  
  
  data.buffer.push(" Sign In ");
  }

function program10(depth0,data) {
  
  var buffer = '', hashTypes;
  data.buffer.push("\n    <div class=\"alert alert-error\">\n        ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "App.flash", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n    </div>\n");
  return buffer;
  }

  data.buffer.push("<div class=\"navbar navbar-inverse navbar-fixed-top\">\n    <div class=\"navbar-inner\">\n        <div class=\"container\">\n            <button type=\"button\" class=\"btn btn-navbar\" data-toggle=\"collapse\" data-target=\".nav-collapse\">\n                <span class=\"icon-bar\"></span>\n                <span class=\"icon-bar\"></span>\n                <span class=\"icon-bar\"></span>\n            </button>\n\n            <a class=\"brand\" href=\"#/\">Nitrogen</a>\n\n            <div class=\"nav-collapse collapse\">\n                ");
  hashTypes = {};
  stack1 = helpers['if'].call(depth0, "App.session", {hash:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                <ul class=\"nav pull-right\">\n                    ");
  hashTypes = {};
  stack1 = helpers['if'].call(depth0, "App.user", {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                </ul>\n            </div>\n\n        </div>\n    </div>\n</div>\n\n");
  hashTypes = {};
  stack1 = helpers['if'].call(depth0, "App.flash", {hash:{},inverse:self.noop,fn:self.program(10, program10, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "outlet", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n");
  return buffer;
  
});

Ember.TEMPLATES["messages"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', stack1, hashTypes, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', stack1, hashTypes;
  data.buffer.push("\n\n    <tr>\n        <td>\n            ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.createdAtString", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n        </td>\n        <td>\n            ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.timestampString", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n        </td>\n        <td>\n            ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.from", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n        </td>\n        <td>\n            ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.message_type", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n        </td>\n        <td>\n            ");
  hashTypes = {};
  stack1 = helpers['if'].call(depth0, "message.isImage", {hash:{},inverse:self.noop,fn:self.program(2, program2, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            ");
  hashTypes = {};
  stack1 = helpers['if'].call(depth0, "message.isLog", {hash:{},inverse:self.noop,fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            ");
  hashTypes = {};
  stack1 = helpers['if'].call(depth0, "message.isIP", {hash:{},inverse:self.noop,fn:self.program(6, program6, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            ");
  hashTypes = {};
  stack1 = helpers['if'].call(depth0, "message.isIPMatch", {hash:{},inverse:self.noop,fn:self.program(8, program8, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n        </td>\n    </tr>\n\n    ");
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = '', hashTypes;
  data.buffer.push("\n                <img ");
  hashTypes = {'src': "STRING"};
  data.buffer.push(escapeExpression(helpers.bindAttr.call(depth0, {hash:{
    'src': ("message.bodyUrlWithAccessToken")
  },contexts:[],types:[],hashTypes:hashTypes,data:data})));
  data.buffer.push(" width=\"320\" height=\"240\" />\n            ");
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = '', hashTypes;
  data.buffer.push("\n                ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.body.severity", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push(": ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.body.message", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n            ");
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = '', hashTypes;
  data.buffer.push("\n                ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.body.ip_address", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n            ");
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = '', hashTypes;
  data.buffer.push("\n                ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "App.IpMatchView", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("\n            ");
  return buffer;
  }

  data.buffer.push("<table class=\"table\">\n    <tr>\n        <th>Timestamp</th>\n        <th>Created</th>\n        <th>From</th>\n        <th>Type</th>\n        <th>Body</th>\n    </tr>\n\n    ");
  hashTypes = {};
  stack1 = helpers.each.call(depth0, "message", "in", "controller", {hash:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n</table>\n");
  return buffer;
  
});

Ember.TEMPLATES["messages/ip_match"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', hashTypes, escapeExpression=this.escapeExpression;


  data.buffer.push("It looks you own device ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "message.body.principal", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push(".  Would you like to claim this device for your account?\n<a class=\"btn btn-primary\" ");
  hashTypes = {'target': "STRING"};
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "claim", "message", {hash:{
    'target': ("view")
  },contexts:[depth0,depth0],types:["ID","ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push(">Claim</a>\n<a class=\"btn btn-primary\" ");
  hashTypes = {'target': "STRING"};
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "reject", "message", {hash:{
    'target': ("view")
  },contexts:[depth0,depth0],types:["ID","ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push(">Reject</a>");
  return buffer;
  
});

Ember.TEMPLATES["principals"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', stack1, hashTypes, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', hashTypes;
  data.buffer.push("\n    <tr>\n        <td>");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "principal.id", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("</td>\n        <td>");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "principal.principal_type", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("</td>\n        <td>");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "principal.name", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("</td>\n        <td>");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "principal.lastConnectionString", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("</td>\n        <td>");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "principal.last_ip", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push("</td>\n    </tr>\n    ");
  return buffer;
  }

  data.buffer.push("<table class=\"table\">\n    <tr>\n        <th>ID</th>\n        <th>Type</th>\n        <th>Name</th>\n        <th>Last Connection</th>\n        <th>Last IP</th>\n    </tr>\n\n    ");
  hashTypes = {};
  stack1 = helpers.each.call(depth0, "principal", "in", "controller", {hash:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0,depth0,depth0],types:["ID","ID","ID"],hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n</table>\n\n");
  return buffer;
  
});

Ember.TEMPLATES["user/create"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', stack1, stack2, hashTypes, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  data.buffer.push("Sign in");
  }

  data.buffer.push("<div class=\"well\">\n\n    <form class=\"form-horizontal\">\n\n        <div class=\"control-group\">\n            <div class=\"controls\">\n                <legend style=\"border:0\">Create Account</legend>\n            </div>\n        </div>\n\n        <div class=\"control-group\">\n            <label class=\"control-label\" for=\"name\">Full Name</label>\n            <div class=\"controls\">\n                <input type=\"text\" id=\"name\" placeholder=\"Full Name\" />\n            </div>\n        </div>\n\n        <div class=\"control-group\">\n            <label class=\"control-label\" for=\"email\">Email</label>\n            <div class=\"controls\">\n                <input type=\"text\" id=\"email\" placeholder=\"Email\" />\n            </div>\n        </div>\n\n        <div class=\"control-group\">\n            <label class=\"control-label\" for=\"password\">Password</label>\n            <div class=\"controls\">\n                <input type=\"password\" id=\"password\" placeholder=\"Password\" />\n            </div>\n        </div>\n\n        <div class=\"control-group\">\n            <div class=\"controls\">\n                <button class=\"btn btn-primary\" ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "create", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push(">Create Account</button>\n                ");
  hashTypes = {'class': "STRING"};
  options = {hash:{
    'class': ("btn")
  },inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data};
  stack2 = ((stack1 = helpers.linkTo),stack1 ? stack1.call(depth0, "user.login", options) : helperMissing.call(depth0, "linkTo", "user.login", options));
  if(stack2 || stack2 === 0) { data.buffer.push(stack2); }
  data.buffer.push("\n            </div>\n        </div>\n\n    </form>\n</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["user/login"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Ember.Handlebars.helpers; data = data || {};
  var buffer = '', stack1, stack2, hashTypes, options, escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  
  data.buffer.push("Create account");
  }

  data.buffer.push("<div class=\"well\">\n\n    <form class=\"form-horizontal\">\n        <div class=\"control-group\">\n            <div class=\"controls\">\n                <legend style=\"border:0\">Sign in</legend>\n            </div>\n        </div>\n\n        <div class=\"control-group\">\n            <label class=\"control-label\" for=\"email\">Email</label>\n            <div class=\"controls\">\n                <input type=\"text\" id=\"email\" placeholder=\"Email\" />\n            </div>\n        </div>\n        <div class=\"control-group\">\n            <label class=\"control-label\" for=\"password\">Password</label>\n            <div class=\"controls\">\n                <input type=\"password\" id=\"password\" placeholder=\"Password\" />\n            </div>\n        </div>\n        <div class=\"control-group\">\n            <div class=\"controls\">\n                <button ");
  hashTypes = {};
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "login", {hash:{},contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data})));
  data.buffer.push(" class=\"btn btn-primary\">Sign in</button>\n                ");
  hashTypes = {'class': "STRING"};
  options = {hash:{
    'class': ("btn")
  },inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],hashTypes:hashTypes,data:data};
  stack2 = ((stack1 = helpers.linkTo),stack1 ? stack1.call(depth0, "user.create", options) : helperMissing.call(depth0, "linkTo", "user.create", options));
  if(stack2 || stack2 === 0) { data.buffer.push(stack2); }
  data.buffer.push("\n            </div>\n        </div>\n    </form>\n\n</div>\n");
  return buffer;
  
});