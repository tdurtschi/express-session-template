// Thanks to https://www.section.io/engineering-education/session-management-in-nodejs-using-expressjs-and-express-session/
const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

const app = express();
const PORT = 4000;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const EXPRESS_SESSIONS_SECRET = process.env.EXPRESS_SESSIONS_SECRET;
const OIDC_REDIRECT_URL = process.env.OIDC_REDIRECT_URL;
const THIRTY_MINUTES = 1000 * 30 * 60;

//session middleware
app.use(
  sessions({
    secret: EXPRESS_SESSIONS_SECRET,
    saveUninitialized: true,
    cookie: { maxAge: THIRTY_MINUTES },
    resave: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(cookieParser());

app.get("/", (req, res) => {
  if (req.session.profile) {
    console.log(req.session.profile);
    res.send(
      `Welcome ${req.session.profile.name}, email ${req.session.profile.email}. <a href='/logout'>click to logout</a>`
    );
  } else res.sendFile("views/index.html", { root: __dirname });
});

app.get("/oidc", (req, res) => {
  res.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${OIDC_CLIENT_ID}&redirect_uri=${OIDC_REDIRECT_URL}&state=foobar2&scope=openid%20profile%20email`
  );
});

app.get("/oidcCallback", async (req, res) => {
  //req.query.code;
  const authTokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: req.query.code,
        client_id: OIDC_CLIENT_ID,
        client_secret: OIDC_CLIENT_SECRET,
        redirect_uri: "http://localhost:4000/oidcCallback",
      }),
    }
  ).then((r) => r.json());

  if (authTokenResponse.access_token) {
    req.session.access_token = authTokenResponse.access_token;

    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      { headers: { Authorization: `Bearer ${req.session.access_token}` } }
    ).then((r) => r.json());

    req.session.profile = profileResponse;
  }

  res.redirect("/");
});

app.get("/oidcLoggedIn", async (req, res) => {
  if (req.session.access_token) {
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      { headers: { Authorization: `Bearer ${req.session.access_token}` } }
    ).then((r) => r.json());

    res.send("You're logged in! \n\n " + JSON.stringify(profileResponse));
  } else {
    res.sendStatus(400, "Not logged in.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.listen(PORT, () => console.log(`Server Running at port ${PORT}`));
