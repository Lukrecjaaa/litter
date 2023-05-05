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
        <p>Choose encryption/decryption mode</p>
        <b-field position="is-centered">
          <b-radio-button v-model="useDecryption"
            :native-value="false"
            type="is-danger">
            <b-icon icon="lock"></b-icon>
            <span>Encrypt (send)</span>
          </b-radio-button>

          <b-radio-button v-model="useDecryption"
            :native-value="true"
            type="is-success">
            <b-icon icon="lock-open"></b-icon>
            <span>Decrypt (receive)</span>
          </b-radio-button>
        </b-field>
        <div v-if="useDecryption" class="encryption-view">
          <p class="justify">
            You're the <b>receiver</b>. To receive a file from someone, generate a
            <b>public/private key pair</b> and send <b style="color: #f14668;">only</b>
            the public key to them. After that use the private key (you can save it in
            a safe place) to decrypt the encrypted file. Decryption takes place in your
            browser, server only sends the encrypted file to you.
          </p>

          <hr>

          <p>
            Private key <b
              :style="{
                'color': privateKey ? '#48c78e' : '#f14668'
              }">
                {{ privateKey ? "loaded" : "not loaded" }}
            </b>
          </p>

          <div v-if="privateKey" style="display: block;">
            <b-field position="is-centered">
              <b-input placeholder="Link to the encrypted file" v-model="encryptedUrl"></b-input>
              <p class="control">
                <b-button class="button is-primary" @click="decryptFile">Download</b-button>
              </p>
            </b-field>
          </div>

          <div v-else>
            <b-button @click="generateKeyPair">
              <b-icon icon="key"></b-icon>
              <span>Generate key pair</span>
            </b-button>

            <p>or</p>

            <b-field class="file is-primary is-centered">
              <b-upload v-model="privateKeyFile" class="file-label" @input="handlePrivateKey">
                <span class="file-cta">
                  <b-icon class="file-icon" icon="file-key"></b-icon>
                  <span class="file-label">Upload private key</span>
                </span>
              </b-upload>
            </b-field>

          </div>
        </div>
        <div v-else class="encryption-view">
          <p class="justify">
            You're the <b>sender</b>. To send the file to someone, ask them to generate a
            <b>public/private key pair</b> and send <b style="color: #f14668;">only</b>
            the public key to you. Upload the key (you can save it for later use) and use
            it to encrypt the file you want to send. Encryption takes place in your browser
            and no sensitive data is sent to the server before that.
          </p>

          <hr>

          <p>
            Public key <b
              :style="{
                'color': publicKey ? '#48c78e' : '#f14668'
              }">
                {{ publicKey ? "loaded" : "not loaded" }}
            </b>
          </p>

          <div v-if="publicKey" style="margin-top: 16px;">
            <div style="margin-bottom: 16px;">
              <b-field position="is-centered">
                <b-radio-button v-model="expireAfter"
                    native-value="1"
                    type="is-info is-light is-outlined">
                    <span>1h</span>
                </b-radio-button>

                <b-radio-button v-model="expireAfter"
                    native-value="12"
                    type="is-info is-light is-outlined">
                    <span>12h</span>
                </b-radio-button>

                <b-radio-button v-model="expireAfter"
                    native-value="24"
                    type="is-info is-light is-outlined">
                    <span>1 day</span>
                </b-radio-button>

                <b-radio-button v-model="expireAfter"
                    native-value="72"
                    type="is-info is-light is-outlined">
                    <span>3 days</span>
                </b-radio-button>
              </b-field>
            </div>

            <b-field>
              <b-upload
                v-model="droppedFilesEnc"
                drag-drop
                multiple
                type="is-success"
                @input="handleFilesEnc">
                <section class="section" id="upload-field">
                  <div class="content has-text-centered">
                    <p>
                      <b-icon icon="upload" size="is-large"></b-icon>
                    </p>
                    <p>Drop or click to upload the file you want to encrypt</p>
                  </div>
                </section>
              </b-upload>
            </b-field>
            <hr>
            <div v-if="fileQueueEnc.length > 0">
              <p>Encryption queue</p>
              <EncryptStatus
                v-for="(item, index) in [...fileQueueEnc].reverse()"
                :file="item.file"
                :started="item.started"
                :failed="item.failed"
                :errText="item.errText"
                :errMessage="item.errMessage"
                v-bind:key="index"
              ></EncryptStatus>
            </div>
            <div v-else>
              <p>The encryption queue is empty</p>
            </div>
            <hr>
            <div v-if="fileQueueEncUpload.length > 0">
              <p>Upload queue</p>
              <UploadStatus
                v-for="(item, index) in [...fileQueueEncUpload].reverse()"
                :file="item.file"
                :started="item.started"
                :uploaded="item.uploaded"
                :failed="item.failed"
                :removed="item.removed"
                :errText="item.errText"
                :errMessage="item.errMessage"
                :url="item.url"
                :progressPercent="item.progressPercent"
                :progress_text="item.progress_text"
                :expireAfter="item.expireAfter"
                v-bind:key="index"
                @remove="removeFile(item.index, true)"
              ></UploadStatus>
            </div>
            <div v-else>
              <p>The upload queue is empty</p>
            </div>
          </div>
          <div v-else style="margin-top: 4px;">
            <b-field class="file is-primary is-centered">
              <b-upload v-model="publicKeyFile" class="file-label" @input="handlePublicKey">
                <span class="file-cta">
                  <b-icon class="file-icon" icon="file-key"></b-icon>
                  <span class="file-label">Upload public key</span>
                </span>
              </b-upload>
            </b-field>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!tokenError && !encrypt">
      <b-field position="is-centered">
        <b-radio-button v-model="expireAfter"
            native-value="1"
            type="is-info is-light is-outlined">
            <span>1h</span>
        </b-radio-button>

        <b-radio-button v-model="expireAfter"
            native-value="12"
            type="is-info is-light is-outlined">
            <span>12h</span>
        </b-radio-button>

        <b-radio-button v-model="expireAfter"
            native-value="24"
            type="is-info is-light is-outlined">
            <span>1 day</span>
        </b-radio-button>

        <b-radio-button v-model="expireAfter"
            native-value="72"
            type="is-info is-light is-outlined">
            <span>3 days</span>
        </b-radio-button>
      </b-field>

      <b-field>
        <b-upload
        v-model="droppedFiles"
        multiple
        drag-drop
        type="is-success"
        @input="handleFiles">
          <section class="section" id="upload-field">
            <div class="content has-text-centered">
              <p>
                <b-icon icon="upload" size="is-large"></b-icon>
              </p>
              <p>Drop your litter here or click to upload</p>
            </div>
          </section>
        </b-upload>
      </b-field>

      <div id="upload-field" style="margin-bottom: 48px;">
        <UploadStatus
          v-for="(item, index) in [...fileQueue].reverse()"
          :file="item.file"
          :started="item.started"
          :uploaded="item.uploaded"
          :failed="item.failed"
          :removed="item.removed"
          :errText="item.errText"
          :errMessage="item.errMessage"
          :url="item.url"
          :progressPercent="item.progressPercent"
          :progress_text="item.progress_text"
          :expireAfter="item.expireAfter"
          v-bind:key="index"
          @remove="removeFile(item.index)"
        ></UploadStatus>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as openpgp from 'openpgp';

import UploadStatus from './components/UploadStatus.vue';
import EncryptStatus from './components/EncryptStatus.vue';

const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

function prettyPrintBytes(value) {
  let index = 0;
  let val = value;

  while (val >= 1024 && ++index) {
    val /= 1024;
  }

  return `${+parseFloat(val).toFixed(2)} ${units[index]}`;
}

export default {
  name: 'App',
  components: {
    UploadStatus,
    EncryptStatus,
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
    };
  },
  methods: {
    handleFiles() {
      this.droppedFiles.forEach((file) => {
        const queueItem = {
          file,
          expireAfter: this.expireAfter,
          started: true,
          uploaded: false,
          failed: false,
          removed: false,
          errText: '',
          errMessage: '',
          filenameEncoded: '',
          url: '',
          progressPercent: 0,
          index: this.index,
          burn: this.burnAfterDownload,
        };

        this.fileQueue.push(queueItem);
        this.droppedFiles = [];

        this.uploadFile(this.index);
        this.index++;
      });
    },
    uploadFile(index, encrypted = false, formDataEnc = null) {
      let item;
      if (encrypted) {
        item = this.fileQueueEncUpload[index];
      } else {
        item = this.fileQueue[index];
      }
      if (item.file.size > this.maxSize) {
        item.started = false;
        item.uploaded = false;
        item.failed = true;
        item.removed = false;

        item.errText = 'Cannot upload file';
        item.errMessage = `Maximum file size exceeded (max ${prettyPrintBytes(this.maxSize)}, got ${prettyPrintBytes(item.file.size)})`;
      } else {
        item.started = true;
        item.uploaded = false;
        item.failed = false;
        item.removed = false;

        const headers = { 'Content-Type': 'multipart/form-data' };
        let formData;
        if (encrypted) {
          formData = formDataEnc;
        } else {
          formData = new FormData();
          formData.append('file', item.file);
        }

        formData.append('expireAfter', item.expireAfter);
        formData.append('burn', item.burn);

        axios.post(`${process.env.VUE_APP_API_URL}/upload`, formData, {
          headers,
          onUploadProgress(progressEvent) {
            item.progressPercent = (progressEvent.loaded / progressEvent.total) * 100;
            item.progress_text = prettyPrintBytes(progressEvent.loaded);
          },
          timeout: 300000,
          params: {
            token: this.token,
          },
        })
          .then((res) => {
            item.filenameEncoded = res.data.path;
            item.url = `${window.location.origin}${window.location.pathname}${item.filenameEncoded}`;
            item.started = false;
            item.uploaded = true;
            item.failed = false;
            item.removed = false;
          })
          .catch((err) => {
            item.errText = 'Cannot upload file';
            item.errMessage = err.response.data;
            item.started = false;
            item.uploaded = false;
            item.failed = true;
            item.removed = false;
          });
      }
    },
    removeFile(index, encrypted = false) {
      let item;

      if (encrypted) {
        item = this.fileQueueEnc[index];
      } else {
        item = this.fileQueue[index];
      }

      axios.get(
        `${process.env.VUE_APP_API_URL}/remove/${item.filenameEncoded}`,
        {
          params: {
            token: this.token,
          },
        },
      )
        .then(() => {
          item.started = false;
          item.uploaded = false;
          item.failed = false;
          item.removed = true;
        })
        .catch((err) => {
          item.errText = 'Cannot remove file';
          item.errMessage = err.response.data;
          item.started = false;
          item.uploaded = false;
          item.failed = true;
          item.removed = false;
        });
    },
    handleFilesEnc() {
      this.droppedFilesEnc.forEach((file) => {
        const queueItem = {
          file,
          expireAfter: this.expireAfter,
          started: true,
          uploaded: false,
          failed: false,
          removed: false,
          errText: '',
          errMessage: '',
          filenameEncoded: '',
          url: '',
          progressPercent: 0,
          index: this.indexEnc,
          burn: this.burnAfterDownload,
        };

        this.fileQueueEnc.push(queueItem);
        this.droppedFilesEnc = [];

        this.encryptFile(this.indexEnc);
        this.indexEnc++;
      });
    },
    encryptFile(index) {
      const item = this.fileQueueEnc[index];
      if (item.file.size > this.maxSize) {
        item.started = false;
        item.failed = true;

        item.errText = 'Cannot encrypt file';
        item.errMessage = `Maximum file size exceeded (max ${prettyPrintBytes(this.maxSize)}, got ${prettyPrintBytes(item.file.size)})`;
      } else {
        const reader = new FileReader();
        reader.readAsArrayBuffer(item.file);
        reader.onload = async () => {
          const data = reader.result;

          try {
            openpgp.encrypt({
              message: await openpgp.createMessage({ binary: new Uint8Array(data) }),
              encryptionKeys: this.publicKey,
              format: 'binary',
            }).then((encrypted) => {
              item.started = false;
              item.failed = false;

              const blob = new Blob([encrypted], { type: 'application/pgp-encrypted' });
              const formData = new FormData();
              formData.append('file', blob, `${item.file.name}.gpg`);

              this.fileQueueEncUpload.push(item);
              this.uploadFile(this.indexEncUpload, true, formData);
              this.indexEncUpload++;
            });
          } catch (error) {
            item.started = false;
            item.failed = true;
            item.errText = 'Failed to encrypt file';
            item.errMessage = error;
          }
        };
      }
    },
    decryptFile() {
      axios.get(this.encryptedUrl, { responseType: 'arraybuffer' })
        .then(async (res) => {
          const filename = /filename="(.*)\.gpg"/.exec(res.headers['content-disposition'])[1];
          const encrypted = new Uint8Array(res.data);

          const encryptedMessage = await openpgp.readMessage({
            binaryMessage: encrypted,
          });

          const { data: decrypted } = await openpgp.decrypt({
            message: encryptedMessage,
            format: 'binary',
            decryptionKeys: this.privateKey,
          });

          const blob = new Blob([decrypted]);

          this.download(blob, filename);
        })
        .catch((err) => {
          this.$buefy.toast.open({
            message: `Cannot decrypt the file. Error: ${err}`,
            position: 'is-bottom',
            type: 'is-danger',
          });
        });
    },
    handlePrivateKey() {
      const reader = new FileReader();
      reader.addEventListener('loadend', async () => {
        try {
          const privateKeyArmored = reader.result;
          this.privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
        } catch (err) {
          this.$buefy.toast.open({
            message: `Loaded private key is invalid. Error: ${err}`,
            position: 'is-bottom',
            type: 'is-danger',
          });
        }
      });
      reader.readAsText(this.privateKeyFile);
    },
    handlePublicKey() {
      const reader = new FileReader();
      reader.addEventListener('loadend', async () => {
        try {
          const publicKeyArmored = reader.result;
          this.publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        } catch {
          this.$buefy.toast.open({
            message: 'Loaded public key is invalid.',
            position: 'is-bottom',
            type: 'is-danger',
          });
        }
      });
      reader.readAsText(this.publicKeyFile);
    },
    generateKeyPair() {
      (async () => {
        const { privateKey, publicKey } = await openpgp.generateKey({
          type: 'ecc',
          curve: 'curve25519',
          userIDs: [{ name: this.token, email: 'no@no.no' }],
          passphrase: '',
          format: 'armored',
        });

        const now = Date.now();

        let blob = new Blob([privateKey], { type: 'text/plain' });
        this.download(blob, `litter-private-${now}.asc`);

        blob = new Blob([publicKey], { type: 'text/plain' });
        this.download(blob, `litter-public-${now}.asc`);
      })();
    },
    download(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
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

  #upload-field {
    margin: 0 auto;
  }

  @media screen and (min-width: 480px) {
    #upload-field {
      width: 440px;
    }

    #app {
      width: 460px;
    }
  }

  @media screen and (max-width: 480px) {
    #upload-field {
      width: 280px;
    }

    #app {
      width: 300px;
    }
  }

  .justify {
    text-align: justify;
    text-justify: inter-word;
  }
</style>
