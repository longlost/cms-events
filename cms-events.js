/**
 * `cms-events`
 * choose from available client events and edit them
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {
  SpritefulElement, 
  html
}                 from '@spriteful/spriteful-element/spriteful-element.js';
import {schedule} from '@spriteful/utils/utils.js';
import htmlString from './cms-events.html';
import services   from '@spriteful/services/services.js';
import '@spriteful/app-modal/app-modal.js';
import '@spriteful/drag-drop-list/drag-drop-list.js';
import '@spriteful/cms-icons/cms-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/iron-icon/iron-icon.js';
import './cms-event-card.js';


class SpritefulCmsEvents extends SpritefulElement {
  static get is() { return 'cms-events'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      coll: {
        type: String,
        value: 'cms/ui/events'
      },

      user: Object,

      _events: Array,
      // passed to each event-item
      _eventsOrder: Array,

      _newEventName: String,
      // for clicked event-card styles
      _selected: {
        type: String,
        value: ''
      },

      _unsubscribe: Object

    };
  }


  static get observers() {
    return [
      '__userChanged(user)'
    ];
  }


  __computeSelectedClass(selected, item) {
    if (!selected || !item) { return ''; }
    return selected === item.id ? 'selected' : '';
  }


  __reset() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }


  async __userChanged(user) {
    if (!user) {
      this.__reset();
      return; 
    }

    const callback = async dbVal => {
      this._events = undefined; // force template to restamp
      await schedule();         // force template to restamp
      this._events = dbVal;
    };

    const errorCallback = error => {
      this._events = undefined;
      if (
        error.message &&
        error.message.includes('document does not exist')
      ) { return; }
      console.error(error);
    };

    this._unsubscribe = await services.subscribe({
      callback, 
      errorCallback,
      coll: this.coll,      
      // respecting saved event index to display them in proper order
      orderBy: {prop: 'index'}
    });
  }


  __openDetails(item) {    
    this.fire('cms-events-open-details', {
      value: item
    });
  }


  __newEventNameInputChanged(event) {
    this._newEventName = event.detail.value;
  }


  async __newEventModalAddButtonClicked() {
    try {
      await this.clicked();
      await this.$.newEventModal.close();
      this.__openDetails({
        name:   this._newEventName, 
        index: -1 // put new events at beginning of list
      });
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __dismissNewEventModalButtonClicked() {
    try {
      await this.clicked();
      this.$.newEventModal.close();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __addNewButtonClicked() {
    try {
      await this.clicked();
      this.$.newEventModal.open();
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }

 
  async __eventClicked(event) {
    try {
      await this.clicked();
      const {item}   = event.model;
      this._selected = item.id;
      this.__openDetails(item);
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  async __handleSortFinished(event) {
    try {
      await this.debounce('cms-events-sort-debounce', 500);

      const orderedItems = this.selectAll('.sortable').map(el => el.item);
      if (!orderedItems.length) { return; }

      const promises = orderedItems.map((item, index) => {
        return services.set({
          coll:  this.coll, 
          doc:   item.id, 
          data:  {index},
          merge: true // only adding indexes to existing data
        });
      });
      await Promise.all(promises);
    }
    catch (error) {
      if (error === 'debounced') { return; }
      console.error(error);
    }
  }

}

window.customElements.define(SpritefulCmsEvents.is, SpritefulCmsEvents);
