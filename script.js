class InvalidURLParamError extends SyntaxError {
  constructor(message) {
    super(message);
    this.name = "InvalidURLParamError";
  }
}

class MetabaseUrlParamParser {
  constructor(url) {
    this.url = new URL(url);
    this.params = new URLSearchParams(this.url.search);
    this.redirectUrlParamName = "redirectUrl";
    this.isDebug = (() => {
      if (this.params.has("debug")) {
        return this.params.get("debug").toLowerCase() === "true";
      } else {
        return false;
      }
    })();

    this.replaceParam();
  }

  replaceParam() {
    const params = this.params;
    for (let i = 0; params.has(`label_${i}`) && params.get(`value_${i}`); i++) {
      const label = params.get(`label_${i}`);
      const value = params.get(`value_${i}`);
      params.delete(`label_${i}`);
      params.delete(`value_${i}`);

      const values =
        MetabaseUrlParamParser.parseMetabaseParamStringAsList(value);
      values?.forEach((value) => {
        params.append(label, value);
      });
    }
    return this;
  }

  static parseParamAsDict(originalParams, paramName) {
    if (originalParams.has(paramName)) {
      const value = originalParams.get(paramName);
      return parseMetabaseParamStringAsList(value);
    }
  }

  static parseMetabaseParamStringAsList(paramString) {
    `
      ex1. "a, b, c, d, and e" => "a, b, c, d,  e" => ["a", "b", "c", "d", "e"]
      ex2. "a" => ... => ["a"]
      ex3. null => null
      ex3. "" or "  " => ""
    `;

    if (paramString === null) {
      return null;
    }

    if (paramString.trim() === "") {
      return "";
    }

    return paramString
      .replace("and", "")
      .split(",")
      .map((el) => el.trim())
      .filter(Boolean);
  }

  extractRedirectUrl() {
    const paramName = this.redirectUrlParamName;
    const params = this.params;
    const redirectUrlParam = params.get(paramName);
    if (redirectUrlParam) {
      params.delete(paramName);
      return new URL(redirectUrlParam);
    } else {
      const msg = `'${this.redirectUrlParamName}' param is not found in url. <br>usage: ${this.usage}`;
      throw new InvalidURLParamError(msg);
    }
  }

  get usage() {
    let replaceParamStr = "";
    for (let i = 0; i < 2; i++) {
      const replaceParamStr2 = `label_${i}={after-url-param-name}&value_${i}={metabase-filter-values}`;
      replaceParamStr += `&${replaceParamStr2}`;
    }
    replaceParamStr += "&...";

    return `${this.url.origin}/${this.url.pathname}?${this.redirectUrlParamName}={your-redirect-url}&debug={true-or-false}${replaceParamStr}`;
  }

  toString() {
    return this.params.toString();
  }
}

const getRedirectUrl = () => {
  const currentParams = new MetabaseUrlParamParser(window.location.href);
  const redirectUrl = currentParams.extractRedirectUrl();
  const newUrl = `${redirectUrl.origin}/${this.url.pathname}?${currentParams.toString()}`;
  return { newUrl, currentParams };
};

const redirectToAnotherSite = () => {
  try {
    const { newUrl, currentParams } = getRedirectUrl();
    if (currentParams.isDebug) {
      appendTestLinkElem();

      const el = document.createElement("div");
      el.innerHTML = `newUrl:<br>${newUrl}`;
      window.document.body.appendChild(el);
    } else {
      window.location.href = newUrl;
    }
  } catch (error) {
    document.body.innerHTML += error.toString() + "<br>";
  }
};

const appendTestLinkElem = () => {
  const currentUrl = new URL(window.location.href)
  const testLink = `${
    currentUrl.origin
  }/${currentUrl.pathname}?redirectUrl=https://google.com&debug=true&label_0=lb0&value_0=a,b,andc&label_1=lb1&value_1=aa,bb,andcc&label_2=lb2&value_2=aa,bb,andcc&hoge=hoge`;
  const el = document.createElement("a");
  el.href = testLink;
  el.innerHTML = `Test Link (${testLink})<br><br>`;
  window.document.body.appendChild(el);
};

window.redirectToAnotherSite = redirectToAnotherSite;
