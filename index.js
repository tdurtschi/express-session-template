const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

const app = express();
const PORT = 4000;
const THIRTY_MINUTES = 1000 * 30 * 60;

// REQUIRED ENVIRONNMENT VARIABLES
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const EXPRESS_SESSIONS_SECRET = process.env.EXPRESS_SESSIONS_SECRET;
const OIDC_REDIRECT_URL = process.env.OIDC_REDIRECT_URL;
const OIDC_ACCESS_TOKEN_URL = process.env.OIDC_ACCESS_TOKEN_URL;
const OIDC_PROFILE_URL = process.env.OIDC_PROFILE_URL;
const OIDC_AUTHORIZATION_URL = process.env.OIDC_AUTHORIZATION_URL;

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
    res.sendFile("views/secure/index.html", { root: __dirname });
  } else {
    res.sendFile("views/index.html", { root: __dirname });
  }
});

app.get("/login", (req, res) => {
  res.redirect(
    `${OIDC_AUTHORIZATION_URL}?response_type=code&client_id=${OIDC_CLIENT_ID}&redirect_uri=${OIDC_REDIRECT_URL}&state=foobar2&scope=openid%20profile%20email`
  );
});

app.get("/oidcCallback", async (req, res) => {
  const authTokenResponse = await fetch(OIDC_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: req.query.code,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
      redirect_uri: OIDC_REDIRECT_URL,
    }),
  }).then((r) => r.json());

  if (authTokenResponse.access_token) {
    req.session.access_token = authTokenResponse.access_token;

    const profileResponse = await fetch(OIDC_PROFILE_URL, {
      headers: { Authorization: `Bearer ${req.session.access_token}` },
    }).then((r) => r.json());

    req.session.profile = profileResponse;
  }

  res.redirect("/");
});

app.get("/profile", (req, res) => {
  if (req.session.profile) {
    res.send(req.session.profile);
  } else {
    res.sendStatus(403);
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.listen(PORT, () => console.log(`Server Running at port ${PORT}`));
