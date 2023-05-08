<template>
  <div>
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

      <!-- Color the loaded/not loaded message in green or red, respectively -->
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
          <b-input
            placeholder="Link to the encrypted file"
            v-model="encryptedUrl"
            :disabled="downloadingEncFile">
          </b-input>
          <p class="control">
            <b-button
              class="button is-primary"
              @click="decryptFile"
              :disabled="downloadingEncFile">
              Download
            </b-button>
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
        <UploadView
          :burn-after-download="burnAfterDownload"
          :encrypt="true"
          :max-size="maxSize"
          :public-key="publicKey"
          :token="token"
        ></UploadView>
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
</template>

<script>
import axios from 'axios';
import * as openpgp from 'openpgp';
import { download } from '../utils';

import UploadView from './UploadView.vue';

export default {
  components: {
    UploadView,
  },
  data() {
    return {
      privateKey: null,
      privateKeyFile: null,
      publicKey: null,
      publicKeyFile: null,
      useDecryption: false,
      encryptedUrl: '',
      downloadingEncFile: false,
    };
  },
  props: ['burnAfterDownload', 'maxSize', 'token'],
  methods: {
    /* Try to open a private key file and parse it with OpenPGP */
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
    /* Same as above, but for a public key file */
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
    /* Generate a random key pair with no passphrase in armored format, and download it */
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
        download(blob, `litter-private-${now}.asc`);

        blob = new Blob([publicKey], { type: 'text/plain' });
        download(blob, `litter-public-${now}.asc`);
      })();
    },
    /* Disable the user input, download file as blob, decrypt it in memory and download it */
    decryptFile() {
      this.downloadingEncFile = true;

      axios.get(this.encryptedUrl, { responseType: 'arraybuffer' })
        .then(async (res) => {
          /* Extract the original file name without .gpg
             extension from Content-Disposition header */
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

          download(blob, filename);
          this.downloadingEncFile = false;
        })
        .catch((err) => {
          this.downloadingEncFile = false;
          this.$buefy.toast.open({
            message: `Cannot decrypt the file. Error: ${err}`,
            position: 'is-bottom',
            type: 'is-danger',
          });
        });
    },
  },
};
</script>
