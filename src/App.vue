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
      droppedFiles: [],
      droppedFilesEnc: [],
      fileQueue: [],
      fileQueueEnc: [],
      fileQueueEncUpload: [],
      expireAfter: '24',
      maxSize: 0,
      maxSizeText: '',
      index: 0,
      indexEnc: 0,
      indexEncUpload: 0,
      token: '',
      tokenError: false,
      burnAfterDownload: false,
      encrypt: false,
      useDecryption: false,
      privateKeyFile: null,
      privateKey: null,
      publicKeyFile: null,
      publicKey: null,
      encryptedUrl: '',
      downloadingEncFile: false,
    };
  },
  mounted() {
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
  #app {
    text-align: center;
    margin: 0 auto;
    overflow-wrap: break-word;
  }

  .large-title {
    font-size: 60pt;
  }

  @media screen and (min-width: 480px) {
    #app {
      width: 460px;
    }
  }

  @media screen and (max-width: 480px) {
    #app {
      width: 300px;
    }
  }

  .justify {
    text-align: justify;
    text-justify: inter-word;
  }
</style>
