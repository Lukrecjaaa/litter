<template>
  <div id="app">

    <div class="section">
      <p class="title large-title">Litter!!<br/>🌷📦</p>
      <p class="subtitle">Maximum allowed size is {{ max_size_text }}</p>
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
                'color': private_key ? '#48c78e' : '#f14668'
              }">
                {{ private_key ? "loaded" : "not loaded" }}
            </b>
          </p>

          <div v-if="private_key" style="display: block;">
            <b-field position="is-centered">
              <b-input placeholder="Link to the encrypted file" v-model="encryptedUrl"></b-input>
              <p class="control">
                <b-button class="button is-primary" @click="decrypt_file">Download</b-button>
              </p>
            </b-field>
          </div>

          <div v-else>
            <b-button @click="generate_key_pair">
              <b-icon icon="key"></b-icon>
              <span>Generate key pair</span>
            </b-button>

            <p>or</p>

            <b-field class="file is-primary is-centered">
              <b-upload v-model="private_key_file" class="file-label" @input="handle_private_key">
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
                'color': public_key ? '#48c78e' : '#f14668'
              }">
                {{ public_key ? "loaded" : "not loaded" }}
            </b>
          </p>

          <div v-if="public_key" style="margin-top: 16px;">
            <div style="margin-bottom: 16px;">
              <b-field position="is-centered">
                <b-radio-button v-model="expire_after"
                    native-value="1"
                    type="is-info is-light is-outlined">
                    <span>1h</span>
                </b-radio-button>
        
                <b-radio-button v-model="expire_after"
                    native-value="12"
                    type="is-info is-light is-outlined">
                    <span>12h</span>
                </b-radio-button>
        
                <b-radio-button v-model="expire_after"
                    native-value="24"
                    type="is-info is-light is-outlined">
                    <span>1 day</span>
                </b-radio-button>
        
                <b-radio-button v-model="expire_after"
                    native-value="72"
                    type="is-info is-light is-outlined">
                    <span>3 days</span>
                </b-radio-button>
              </b-field>
            </div>

            <b-field>
              <b-upload v-model="dropped_files_enc" drag-drop multiple type="is-success" @input="handle_files_enc">
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
            <div v-if="file_queue_enc.length > 0">
              <p>Encryption queue</p>
              <EncryptStatus
                v-for="(item, index) in [...file_queue_enc].reverse()"
                :file="item.file"
                :started="item.started"
                :failed="item.failed"
                :err_text="item.err_text"
                :err_message="item.err_message"
                v-bind:key="index"
              ></EncryptStatus>
            </div>
            <div v-else>
              <p>The encryption queue is empty</p>
            </div>
            <hr>
            <div v-if="file_queue_enc_upload.length > 0">
              <p>Upload queue</p>
              <UploadStatus
                v-for="(item, index) in [...file_queue_enc_upload].reverse()"
                :file="item.file"
                :started="item.started"
                :uploaded="item.uploaded"
                :failed="item.failed"
                :removed="item.removed"
                :err_text="item.err_text"
                :err_message="item.err_message"
                :url="item.url"
                :progress_percent="item.progress_percent"
                :progress_text="item.progress_text"
                :expire_after="item.expire_after"
                v-bind:key="index"
                @remove="remove_file(item.index, true)"
              ></UploadStatus>
            </div>
            <div v-else>
              <p>The upload queue is empty</p>
            </div>
          </div>
          <div v-else style="margin-top: 4px;">
            <b-field class="file is-primary is-centered">
              <b-upload v-model="public_key_file" class="file-label" @input="handle_public_key">
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
        <b-radio-button v-model="expire_after"
            native-value="1"
            type="is-info is-light is-outlined">
            <span>1h</span>
        </b-radio-button>

        <b-radio-button v-model="expire_after"
            native-value="12"
            type="is-info is-light is-outlined">
            <span>12h</span>
        </b-radio-button>

        <b-radio-button v-model="expire_after"
            native-value="24"
            type="is-info is-light is-outlined">
            <span>1 day</span>
        </b-radio-button>

        <b-radio-button v-model="expire_after"
            native-value="72"
            type="is-info is-light is-outlined">
            <span>3 days</span>
        </b-radio-button>
      </b-field>

      <b-field>
        <b-upload v-model="dropped_files" multiple drag-drop type="is-success" @input="handle_files">
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
          v-for="(item, index) in [...file_queue].reverse()"
          :file="item.file"
          :started="item.started"
          :uploaded="item.uploaded"
          :failed="item.failed"
          :removed="item.removed"
          :err_text="item.err_text"
          :err_message="item.err_message"
          :url="item.url"
          :progress_percent="item.progress_percent"
          :progress_text="item.progress_text"
          :expire_after="item.expire_after"
          v-bind:key="index"
          @remove="remove_file(item.index)"
        ></UploadStatus>
      </div>
    </div>
  </div>
</template>

<script>
import UploadStatus from './components/UploadStatus.vue';
import EncryptStatus from './components/EncryptStatus.vue';
import axios from 'axios';
import * as openpgp from 'openpgp';

const units = ["bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

function prettyPrintBytes(value) {
  let index = 0;

  while (value >= 1024 && ++index) {
    value = value / 1024;
  }

  return +parseFloat(value).toFixed(2) + " " + units[index];
}

export default {
  name: 'App',
  components: {
    UploadStatus,
    EncryptStatus
  },
  data() {
    return {
      dropped_files: [],
      dropped_files_enc: [],
      file_queue: [],
      file_queue_enc: [],
      file_queue_enc_upload: [],
      expire_after: '24',
      max_size: 0,
      max_size_text: '',
      index: 0,
      index_enc: 0,
      index_enc_upload: 0,
      token: '',
      tokenError: false,
      burnAfterDownload: false,
      encrypt: false,
      useDecryption: false,
      private_key_file: null,
      private_key: null,
      public_key_file: null,
      public_key: null,
      encryptedUrl: '',
    };
  },
  methods: {
    handle_files() {
      this.dropped_files.forEach(file => {
        let queueItem = {
          file: file,
          expire_after: this.expire_after,
          started: true,
          uploaded: false,
          failed: false,
          removed: false,
          err_text: '',
          err_message: '',
          filename_encoded: '',
          url: '',
          progress_percent: 0,
          index: this.index,
          burn: this.burnAfterDownload
        };

        this.file_queue.push(queueItem);
        this.dropped_files = [];

        this.upload_file(this.index);
        this.index++;
      });
    },
    upload_file(index, encrypted = false, formDataEnc = null) {
      let item;
      if (encrypted) {
        item = this.file_queue_enc_upload[index];
      } else {
        item = this.file_queue[index];
      }
      if (item.file.size > this.max_size) {
        item.started = false;
        item.uploaded = false;
        item.failed = true;
        item.removed = false;
        
        item.err_text = 'Cannot upload file';
        item.err_message = `Maximum file size exceeded (max ${prettyPrintBytes(this.max_size)}, got ${prettyPrintBytes(item.file.size)})`;
      } else {
        item.started = true;
        item.uploaded = false;
        item.failed = false;
        item.removed = false;

        const headers = { "Content-Type": "multipart/form-data" };
        let formData;
        if (encrypted) {
          formData = formDataEnc;
        } else {
          formData = new FormData();
          formData.append('file', item.file);
        }
        
        formData.append('expire_after', item.expire_after);
        formData.append('burn', item.burn);
    
        axios.post(`${process.env.VUE_APP_API_URL}/upload`, formData, {
          headers,
          onUploadProgress: function (progressEvent) {
            item.progress_percent = (progressEvent.loaded / progressEvent.total) * 100;
            item.progress_text = prettyPrintBytes(progressEvent.loaded);
          },
          timeout: 300000,
          params: {
            token: this.token
          }
        })
        .then((res) => {
          item.filename_encoded = res.data.path;
          item.url = `${window.location.origin}${window.location.pathname}${item.filename_encoded}`;
          item.started = false;
          item.uploaded = true;
          item.failed = false;
          item.removed = false;
        })
        .catch((err) => {
          item.err_text = 'Cannot upload file';
          item.err_message = err.response.data;
          item.started = false;
          item.uploaded = false;
          item.failed = true;
          item.removed = false;
        });
      }
    },
    remove_file(index, encrypted = false) {
      let item;

      if (encrypted) {
        item = this.file_queue_enc[index];
      } else {
        item = this.file_queue[index];
      }

      axios.get(`${process.env.VUE_APP_API_URL}/remove/${item.filename_encoded}`,
      {
        params: {
          token: this.token
        }
      })
      .then(() => {
        item.started = false;
        item.uploaded = false;
        item.failed = false;
        item.removed = true;
      })
      .catch((err) => {
        item.err_text = 'Cannot remove file';
        item.err_message = err.response.data;
        item.started = false;
        item.uploaded = false;
        item.failed = true;
        item.removed = false;
      });
    },
    handle_files_enc() {
      this.dropped_files_enc.forEach(file => {
        let queueItem = {
          file: file,
          expire_after: this.expire_after,
          started: true,
          uploaded: false,
          failed: false,
          removed: false,
          err_text: '',
          err_message: '',
          filename_encoded: '',
          url: '',
          progress_percent: 0,
          index: this.index_enc,
          burn: this.burnAfterDownload
        };

        this.file_queue_enc.push(queueItem);
        this.dropped_files_enc = [];

        this.encrypt_file(this.index_enc);
        this.index_enc++;
      });
    },
    encrypt_file(index) {
      let item = this.file_queue_enc[index];
      if (item.file.size > this.max_size) {
        item.started = false;
        item.failed = true;
        
        item.err_text = 'Cannot encrypt file';
        item.err_message = `Maximum file size exceeded (max ${prettyPrintBytes(this.max_size)}, got ${prettyPrintBytes(item.file.size)})`;
      } else {
        const reader = new FileReader();
        reader.readAsArrayBuffer(item.file);
        reader.onload = async () => {
          const data = reader.result;

          try {
            openpgp.encrypt({
              message: await openpgp.createMessage({ binary: new Uint8Array(data) }),
              encryptionKeys: this.public_key,
              format: 'binary'
            }).then((encrypted) => {
              item.started = false;
              item.failed = false;

              const blob = new Blob([encrypted], { type: 'application/pgp-encrypted' });
              const formData = new FormData();
              formData.append('file', blob, item.file.name + '.gpg');

              this.file_queue_enc_upload.push(item);
              this.upload_file(this.index_enc_upload, true, formData);
              this.index_enc_upload++;
            });
          } catch (error) {
            item.started = false;
            item.failed = true;
            item.err_text = 'Failed to encrypt file';
            item.err_message = error;
            console.log(error);
          }
        };
      }
    },
    decrypt_file() {
      axios.get(this.encryptedUrl, { responseType: 'arraybuffer' })
        .then(async (res) => {
          let filename = /filename="(.*)\.gpg"/.exec(res.headers['content-disposition'])[1];
          const encrypted = new Uint8Array(res.data);
          
          const encryptedMessage = await openpgp.readMessage({
            binaryMessage: encrypted
          });
          
          const { data: decrypted } = await openpgp.decrypt({
            message: encryptedMessage,
            format: 'binary',
            decryptionKeys: this.private_key
          });

          const blob = new Blob([decrypted]);

          this.download(blob, filename);
        })
        .catch((err) => {
          this.$buefy.toast.open({
            message: `Cannot decrypt the file. Error: ${err}`,
            position: 'is-bottom',
            type: 'is-danger'
          });
        });
    },
    handle_private_key() {
      const reader = new FileReader();
      reader.addEventListener('loadend', async () => {
        try {
          const privateKeyArmored = reader.result;
          this.private_key = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
        } catch (err) {
          this.$buefy.toast.open({
            message: `Loaded private key is invalid. Error: ${err}`,
            position: 'is-bottom',
            type: 'is-danger'
          });
        }
      });
      reader.readAsText(this.private_key_file);
    },
    handle_public_key() {
      const reader = new FileReader();
      reader.addEventListener('loadend', async () => {
        try {
          const publicKeyArmored = reader.result;
          this.public_key = await openpgp.readKey({ armoredKey: publicKeyArmored });
        } catch {
          this.$buefy.toast.open({
            message: 'Loaded public key is invalid.',
            position: 'is-bottom',
            type: 'is-danger'
          });
        }
      });
      reader.readAsText(this.public_key_file);
    },
    generate_key_pair() {
      (async () => {
        const { privateKey, publicKey } = await openpgp.generateKey({
          type: 'ecc',
          curve: 'curve25519',
          userIDs: [{ name: this.token, email: 'no@no.no' }],
          passphrase: '',
          format: 'armored'
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
    }
  },
  mounted() {
    this.max_size = Number(process.env.VUE_APP_MAX_FILE_SIZE || 104857600);
    this.max_size_text = prettyPrintBytes(this.max_size);
    axios.get(`${process.env.VUE_APP_API_URL}/token`)
      .then((res) => {
        this.token = res.data.token;
      })
      .catch(() => {
        this.tokenError = true;
      });
  },
  watch: {}
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
