/**
 * `cms-event-details`
 * custom inventory item detail overlay view
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import {
  compose, 
  join, 
  map, 
  split
}                 from '@longlost/lambda/lambda.js';
import {
  listen,
  message,
  schedule,
  warn
}                 from '@longlost/utils/utils.js';
import htmlString from './cms-event-details.html';
import services   from '@longlost/services/services.js';
import '@longlost/app-header-overlay/app-header-overlay.js';
import '@longlost/app-icons/app-icons.js';
import '@longlost/app-modal/app-modal.js';
import '@longlost/app-spinner/app-spinner.js';
import '@longlost/cms-icons/cms-icons.js';
import '@longlost/image-editor/image-editor.js';
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


class CmsEventDetails extends AppElement {
  static get is() { return 'cms-event-details'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      coll: {
        type: String,
        value: 'cms/ui/events'
      },

      seats: Number,

      _item: Object,

      _doc: {
        type: String,
        computed: '__computeDoc(_item.name)'
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

      _valid: Boolean,

      _imageReady: Boolean

    };
  }


  static get observers() {
    return [
      '__docChanged(_doc)',
      '__itemChanged(_item.*)',
      '__seatsChanged(seats)'
    ];
  }


  connectedCallback() {
    super.connectedCallback();

    listen(this.$.editor, 'image-editor-ready-changed',  this.__imageChangesReady.bind(this));
    listen(this.$.editor, 'data-changed',                this.__imageDataChanged.bind(this));
    listen(this,          'asg-event-card-open-details', this.__openPreviewDetails.bind(this));
  }


  __computeDoc(name) {
    if (!name) { return ''; }
    return removeSpacesAndCaps(name);
  }


  __computePublishBtnDisabled(imageReady, valid) {
    if (imageReady && valid) {
      return false;
    }
    return true;
  }


  __docChanged(doc) {
    if (!doc) { return; }
    this.set('_item.id', doc);
  }


  __itemChanged(obj) {
    if (!obj || !obj.base) {
      this._valid = false;
      return;
    }
    const {base: item} = obj;
    const requiredVals = Object.values(this._requiredAttrs);
    this._valid = undefined;
    this._valid = requiredVals.every(val => val);
    this.fire('cms-event-details-item-changed', {item});
  }


  __seatsChanged(seats) {
    if (seats === undefined) { return; }
    this.set('_item.seats', seats);
  }


  __imageChangesReady(event) {
    this._imageReady = event.detail.value;
  }


  __imageDataChanged(event) {
    this.set('_item.images', {...event.detail});
  }


  __featuredCheckboxChanged(event) {
    const {value} = event.detail;
    this.set('_item.featured', value);
  }
  

  __titleInputChanged(event) {
    const {value} = event.detail;
    this.set('_item.title', value);
    // required for longlost-checkout
    this.set('_item.displayName', value); 
  }
  

  __feeInputChanged(event) {
    const {value} = event.detail;
    this.set('_item.fee',    value);
    // required for longlost-checkout
    this.set('_item.amount', Number(value).toFixed(2));
  }


  __seatsInputChanged(event) {
    const {value} = event.detail;
    this.set('_item.seats', value);
  }
  

  __dateInputChanged(event) {
    const {value} = event.detail;
    this.set('_item.date', value);
  }


  __rulesLinkLableInputChanged(event) {
    const {value} = event.detail;
    this.set('_item.rulesLinkLabel', value);
  }

  __rulesLinkInputChanged(event) {
    const {value} = event.detail;
    this.set('_item.rulesLink', value);
  }


  __preRegisterBtnChanged(event) {
    const {value} = event.detail;
    this.set('_item.preRegister', value);
  }


  __textAreaValueChanged(event) {
    const {value} = event.detail;
    this.set('_item.details', value);
  }


  __bulletInputChanged(event) {
    const {detail, model} = event;
    model.set('item', detail.value);
  }


  __removeBulletBtnClicked(event) {
    const {index} = event.model;
    this.splice('_item.bullets', index, 1);
  }


  __addBulletBtnClicked() {
    if ('bullets' in this._item === false) {
      this.set('_item.bullets', []);
    }
    this.push('_item.bullets', '');
  }


  async __openPreviewDetails(event) {
    await import('@spriteful/asg-event-shared-elements/event-details.js');
    this.$.previewDetails.open(event.detail.eventItem);
  }


  async __publishChangesButtonClicked() {
    try {
      await this.clicked();
      await this.$.spinner.show('Saving changes...');
      await services.set({
        coll:  this.coll, 
        doc:   this._doc, 
        data:  this._item,
        merge: true
      });
      message('Your changes are now live!'); 
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
      await warn('Sorry, an unexpected error occured.');
    }
    finally { 
      this.$.spinner.hide(); 
    }
  }


  async __deleteEvent() {
    try {
      await this.$.spinner.show('Deleting event...');
      await this.$.editor.deleteAll(); 
      await services.deleteDocument({
        coll: this.coll, 
        doc:  this._doc
      });
      this._item = undefined;
      await this.$.overlay.close();
    }
    catch (error) {
      console.error(error);
      await warn('Sorry, an unexpected error occured.');
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


  async open(item) {
    try {
      this.set('_item', item);
      await schedule();
      await this.$.overlay.open();
    }
    catch(error) {
      console.error(error);
    }
  }

}

window.customElements.define(CmsEventDetails.is, CmsEventDetails);
