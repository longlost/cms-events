/**
 * `event-item`
 * edit a client app event
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {
  SpritefulElement, 
  html
}                 from '@spriteful/spriteful-element/spriteful-element.js';
import {
  compose, 
  join, 
  map, 
  split
}                 from '@spriteful/lambda/lambda.js';
import {
  getRootTarget,
  listen, 
  message,
  warn
}                 from '@spriteful/utils/utils.js';
import htmlString from './event-item.html';
import services   from '@spriteful/services/services.js';
import '@spriteful/app-icons/app-icons.js';
import '@spriteful/app-spinner/app-spinner.js';
import '@spriteful/app-modal/app-modal.js';
import '@spriteful/cms-icons/cms-icons.js';
import '@spriteful/cms-image-editor/cms-image-editor.js';
import '@spriteful/asg-icons/asg-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-input/paper-textarea.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icon/iron-icon.js';


const trim                = str => str.trim();
const toLower             = str => str.toLowerCase();
const removeSpacesAndCaps = compose(trim, split(' '), map(toLower), join(''));


class SpritefulCmsEventItem extends SpritefulElement {
  static get is() { return 'event-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      target: String,

      eventItem: {
        type: Object,
        notify: true,
        computed: '__computeEventTtem(_attributes.*, _previewImage)'
      },

      eventsOrder: Array,

      seats: Number,

      _attributes: Object,

      _doc: {
        type: String,
        computed: '__computeDoc(target)'
      },

      _initialAttributes: {
        type: Object,
        value: {
          amount: '',
          bullets: [],        // not required
          date: null,
          description: 'Event Registration', // required by app-checkout
          details: null,
          displayName: '',    // required by app-checkout
          featured: false,    // not required
          fee: null,
          preRegister: null,  // not required
          rulesLink: '',      // not required
          rulesLinkLabel: '', // not required
          seats: '',
          title: ''
        }
      },

      _requiredAttrs: {
        type: Object,
        value: () => ({
          date: true,
          details: true,
          fee: true,
          seats: true,
          title: true
        })
      },

      _attributesComplete: Boolean,

      _events: Array,
      // temporarily ignore editor events
      // when its reset method is called 
      // when publishing updates
      _ignoreEditorEvents: Boolean,

      _imageReady: Boolean,

      _previewImage: Object

    };
  }


  static get observers() {
    return [
      '__docChanged(_doc)',
      '__attributesChanged(_attributes.*)',
      '__imageReadyChanged(_imageReady)'
    ];
  }


  constructor() {
    super();

    this.__initializeAttributes();
  }


  connectedCallback() {
    super.connectedCallback();

    listen(this, 'cms-image-editor-changes-ready', this.__imageChangesReady.bind(this));
  }


  __computeDoc(target) {
    if (!target) { return ''; }
    return removeSpacesAndCaps(target);
  }


  __computePublishBtnDisabled(imageReady, attributesComplete) {
    if (imageReady && attributesComplete) {
      return false;
    }
    return true;
  }


  __computeEventTtem(attributes, preview) {
    return Object.assign({}, preview, attributes.base);
  }


  async __docChanged(doc) {
    if (!doc) { return; }
    try {
      await this.$.spinner.show('Loading event data...');
      this.style.opacity         = '1';
      const imageGetPromise      = this.reset();
      const attributesGetPromise = services.get({
        coll: 'cms/ui/events', 
        doc:   doc
      });
      const [attributes] = await Promise.all([attributesGetPromise, imageGetPromise]);
      this._attributes   = Object.assign({}, this._attributes, attributes);
      const keys         = Object.keys(this.$.editor.getImages());
      this._imageReady   = undefined; // force rerun observer methods
      this._imageReady   = Boolean(keys.length);
    }
    catch (error) {
      if (error === 'show spinner transition was trampled') { return; }
      if (error.message) {
        const text = error.message.split('!')[0];
        if (text === 'Error: No such document') { return; } // ignore new instances
      }
      console.error(error);
      warn('Sorry, an unexpected error occured.');
    }
    finally {
      this.$.spinner.hide();
    }
  }


  __attributesChanged(attributes) {
    if (!attributes) {
      this._attributesComplete = false;
    }
    const {base: attrs}      = attributes;
    const requiredKeys       = Object.keys(this._requiredAttrs);
    const requiredVals       = requiredKeys.map(key => attrs[key]);
    this._attributesComplete = undefined;
    this._attributesComplete = requiredVals.every(val => val);
  }


  __featuredCheckboxChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.featured', value);
  }
  

  __titleInputChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.title', value);
    // required for spriteful-checkout
    this.set('_attributes.displayName', value); 
  }
  

  __feeInputChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.fee',    value);
    this.set('_attributes.amount', Number(value).toFixed(2));
  }


  __seatsInputChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.seats', value);
  }
  

  __dateInputChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.date', value);
  }


  __rulesLinkLableInputChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.rulesLinkLabel', value);
  }

  __rulesLinkInputChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.rulesLink', value);
  }


  __preRegisterBtnChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.preRegister', value);
  }


  __textAreaValueChanged(event) {
    const {value} = event.detail;
    this.set('_attributes.details', value);
  }


  __bulletInputChanged(event) {
    const {detail, model} = event;
    model.set('item', detail.value);
  }


  __initializeAttributes() {
    this._attributes = Object.assign(
      {}, 
      this._initialAttributes, 
      {seats: this.seats}
    );
  }


  __removeBulletBtnClicked(event) {
    const {index} = event.model;
    this.splice('_attributes.bullets', index, 1);
  }


  __addBulletBtnClicked() {
    this.push('_attributes.bullets', '');
  }
  

  __imageReadyChanged(ready) {
    if (this._ignoreEditorEvents) { return; }
    if (ready) {
      const image        = this.$.editor.getImages();
      const [key]        = Object.keys(image);
      this._previewImage = image[key];
    }
    else {
      this._previewImage = undefined;
    }
  }


  __imageChangesReady(event) {
    this._imageReady = event.detail.ready;
  }


  __saveNewEventsOrder() {
    if (!this.eventsOrder) { return; }
    const promises = this.eventsOrder.map((target, index) => {
      return services.set({
        coll: 'cms/ui/events', 
        doc:   removeSpacesAndCaps(target), 
        data:  {index},
        merge: true // only adding indexes to existing data
      });
    });
    return Promise.all(promises);
  }


  async __publishChangesButtonClicked() {
    try {
      await this.clicked();
      await this.$.spinner.show('Saving changes...');
      const images = this.$.editor.getImages(); 
      await services.set({
        coll: 'cms/ui/events', 
        doc:   this._doc, 
        data:  Object.assign({}, this._attributes, {
          displayName: this.target, 
          name:        this._doc, 
          images
        }),
        merge: true // race with db processing uploaded img
      });
      await this.__saveNewEventsOrder();
      this._ignoreEditorEvents = true;
      await this.$.editor.reset(); 
      message('Your changes are now live!'); 
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
      warn('Sorry, an unexpected error occured.');
    }
    finally {
      this._ignoreEditorEvents = false;    
      this.$.spinner.hide(); 
    }
  }


  async __deleteEvent() {
    try {
      await this.$.spinner.show();
      const image = this.$.editor.getImages();
      const [key] = Object.keys(image);
      if (image[key]) {
        const {name, path} = image[key];
        await this.$.editor.deleteImage(name, path);
      }
      await services.deleteDocument({coll: 'cms/ui/events', doc: this._doc});
      this.fire('item-deleted', {target: this.target});
    }
    catch (error) {
      console.error(error);
      warn('Sorry, an unexpected error occured.');
    }
    finally {
      this.$.spinner.hide();
    }
  }


  async __deleteModalConfirmButtonClicked() {
    try {
      await this.clicked();
      await this.$.deleteModal.close();
      this.__deleteEvent();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __dismissNewEventModalButtonClicked() {
    try {
      await this.clicked();
      this.$.deleteModal.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __deleteEventButtonClicked() {
    try {
      await this.clicked();
      this.$.deleteModal.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  reset() {
    this._previewImage = undefined;
    this.__initializeAttributes();
    return this.$.editor.reset();
  }

}

window.customElements.define(SpritefulCmsEventItem.is, SpritefulCmsEventItem);
