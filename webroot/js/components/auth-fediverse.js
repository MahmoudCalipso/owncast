import { h, Component } from '/js/web_modules/preact.js';
import htm from '/js/web_modules/htm.js';

const html = htm.bind(h);

export default class FediverseAuth extends Component {
  constructor(props) {
    super(props);

    this.submitButtonPressed = this.submitButtonPressed.bind(this);

    this.state = {
      account: '',
      code: '',
      errorMessage: null,
      loading: false,
      verifying: false,
      valid: true,
    };
  }

  async makeRequest(url, data) {
    const rawResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const content = await rawResponse.json();
    if (content.message) {
      this.setState({ errorMessage: content.message, loading: false });
      return;
    }
  }

  switchToCodeVerify() {
    this.setState({ verifying: true, loading: false });
  }

  async validateCodeButtonPressed() {
    const { accessToken } = this.props;
    const { code } = this.state;

    this.setState({ loading: true, errorMessage: null });

    const url = `/api/auth/fediverse/verify?accessToken=${accessToken}`;
    const data = { code: code };

    try {
      await this.makeRequest(url, data);

      // Success. Reload the page.
      window.location = '/';
    } catch (e) {
      console.error(e);
      this.setState({ errorMessage: e, loading: false });
    }
  }

  async registerAccountButtonPressed() {
    const { accessToken } = this.props;
    const { account, valid } = this.state;

    if (!valid) {
      return;
    }

    const url = `/api/auth/fediverse?accessToken=${accessToken}`;
    const data = { account: account };

    this.setState({ loading: true, errorMessage: null });

    try {
      await this.makeRequest(url, data);
      this.switchToCodeVerify();
    } catch (e) {
      console.error(e);
      this.setState({ errorMessage: e, loading: false });
    }
  }

  async submitButtonPressed() {
    const { verifying } = this.state;
    if (verifying) {
      this.validateCodeButtonPressed();
    } else {
      this.registerAccountButtonPressed();
    }
  }

  onInput = (e) => {
    const { value } = e.target;
    const { verifying } = this.state;

    if (verifying) {
      this.setState({ code: value });
      return;
    }

    let valid = true;
    this.setState({ account: value, valid });
  };

  render() {
    const { errorMessage, account, code, valid, loading, verifying } =
      this.state;
    const buttonState = valid ? '' : 'cursor-not-allowed opacity-50';

    const loaderStyle = loading ? 'flex' : 'none';
    const message = verifying
      ? 'Please paste in the code that was sent to your Fediverse account.'
      : 'By supplying your Fediverse account you can log into chat.';
    const label = verifying ? 'Code' : 'Your fediverse account';
    const placeholder = verifying ? '123456' : 'youraccount@fediverse.server';
    const buttonText = verifying ? 'Verify' : 'Authenticate';

    const error = errorMessage
      ? html` <div
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <div class="font-bold mb-2">There was an error.</div>
          <div class="block mt-2">
            Server error:
            <div>${errorMessage}</div>
          </div>
        </div>`
      : null;

    return html`
      <div class="bg-gray-100 bg-center bg-no-repeat p-4">
        <p class="text-gray-700 text-md">${message}</p>

        ${error}

        <div class="mb34">
          <label
            class="block text-gray-700 text-sm font-semibold mt-6"
            for="username"
          >
            ${label}
          </label>
          <input
            onInput=${this.onInput}
            type="url"
            value=${verifying ? code : account}
            class="border bg-white rounded w-full py-2 px-3 mb-2 mt-2 text-indigo-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder=${placeholder}
          />
          <button
            class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 mt-6 px-4 rounded focus:outline-none focus:shadow-outline ${buttonState}"
            type="button"
            onClick=${this.submitButtonPressed}
          >
            ${buttonText}
          </button>
        </div>

        <div
          id="follow-loading-spinner-container"
          style="display: ${loaderStyle}"
        >
          <img id="follow-loading-spinner" src="/img/loading.gif" />
          <p class="text-gray-700 text-lg">Authenticating.</p>
          <p class="text-gray-600 text-lg">Please wait...</p>
        </div>
      </div>
    `;
  }
}

function validateURL(url) {
  if (!url) {
    return false;
  }

  try {
    const u = new URL(url);
    if (!u) {
      return false;
    }

    if (u.protocol !== 'https:') {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}
