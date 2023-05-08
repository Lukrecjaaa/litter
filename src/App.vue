<template>
  <div id="app">
    <div class="section">
      <p class="title large-title">Litter!!<br/>🌷📦</p>
      <p class="subtitle">Maximum allowed size is {{ maxSizeText }}</p>
    </div>

    <b-notification
      type="is-danger"
      has-icon
      role="alert"
      :closable="false"
      v-model="tokenError"
      style="width: 300px; margin: 0 auto; margin-bottom: 48px; text-align: start;">
      Can't get session token, please refresh the page to try again.<br>
    </b-notification>

    <div style="margin-bottom: 32px" v-if="!tokenError">
      <div style="padding: 4px;">
        <b-switch v-model="burnAfterDownload">
          Burn-after-download
        </b-switch>

        <b-switch v-model="encrypt">
          Encryption mode
        </b-switch>
      </div>

      <div v-if="encrypt">
        <EncryptView
          :burn-after-download="burnAfterDownload"
          :max-size="maxSize"
          :token="token"
        ></EncryptView>
      </div>
    </div>

    <div v-if="!tokenError && !encrypt">
      <UploadView
        :burn-after-download="burnAfterDownload"
        :encrypt="false"
        :max-size="maxSize"
        :token="token"
      ></UploadView>
    </div>

    <footer><small style="font-size: 0.7rem; color: #BA90C6;">
      <a href="https://github.com/Lukrecjaaa/litter">Source code</a> | Art by <a href="https://www.pixiv.net/en/artworks/91042496">40hara</a>
    </small></footer>
  </div>
</template>

<script>
import axios from 'axios';
import { prettyPrintBytes } from './utils';

import UploadView from './components/UploadView.vue';
import EncryptView from './components/EncryptView.vue';

export default {
  name: 'App',
  components: {
    UploadView,
    EncryptView,
  },
  data() {
    return {
      maxSize: 0,
      maxSizeText: '',
      token: '',
      tokenError: false,
      burnAfterDownload: false,
      encrypt: false,
    };
  },
  mounted() {
    /* Get token and format maxSize to a human-readable format */
    this.maxSize = Number(process.env.VUE_APP_MAX_FILE_SIZE || 104857600);
    this.maxSizeText = prettyPrintBytes(this.maxSize);
    axios.get(`${process.env.VUE_APP_API_URL}/token`)
      .then((res) => {
        this.token = res.data.token;
      })
      .catch(() => {
        this.tokenError = true;
      });
  },
  watch: {},
};
</script>

<style>
  html {
    background-image:
    radial-gradient(#faebed 3px, transparent 3px),
    radial-gradient(#faebed 3px, transparent 3px);
    background-size: calc(30 * 1px) calc(30 * 1px);
    background-position: 0 0, calc(15 * 5px) calc(15 * 5px);
    background-attachment: fixed;
  }

  body {
    background-image: url('./assets/images/box.png');
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-size: 200px;
    background-position: bottom right;
    min-height: 100vh;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  #app {
    background-color: rgba(253, 244, 245, 0.7);
    margin-top: 16px;
    padding-bottom: 8px;
    border-radius: 16px;
    text-align: center;
    margin: 0 auto;
    overflow-wrap: break-word;
  }

  .large-title {
    font-size: 60pt;
  }

  @media screen and (min-width: 550px) {
    #app {
      width: 500px;
    }
  }

  @media screen and (max-width: 550px) {
    #app {
      width: 90%;
    }
  }

  .justify {
    text-align: justify;
    text-justify: inter-word;
  }
</style>
