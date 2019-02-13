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
import htmlString from './cms-events.html';
import services   from '@spriteful/services/services.js';
import '@spriteful/app-modal/app-modal.js';
import '@spriteful/drag-drop-list/drag-drop-list.js';
import '@spriteful/cms-icons/cms-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/iron-icon/iron-icon.js';
import './event-item.js';


class SpritefulCmsEvents extends SpritefulElement {
  static get is() { return 'cms-events'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      // passed up (will need to change to events for lit-html)
      eventItem: {
        type: Object,
        notify: true
      },
      // pass through
      seats: Number,

      user: Object,
      // passed to each event-item
      _eventsOrder: Array,

      _newEventName: String,

      _selected: {
        type: String,
        value: ''
      },

      _targets: Array

    };
  }


  static get observers() {
    return [
      '__userChanged(user)'
    ];
  }


  __computeSelectedClass(selected, target) {
    if (!selected || !target) { return ''; }
    return selected === target ? 'selected' : '';
  }


  async __userChanged(user) {
    if (!user) { return; }
    // fetch available events
    const events  = await services.getAll({coll: 'cms/ui/events'});
    // respecting saved event index to display them in proper order
    this._targets = events.
      reduce((accum, event) => {
        const {displayName, index} = event;
        if (typeof index === 'number') {
          accum[index] = displayName;
        }
        return accum;
      }, []).
      filter(target => target);
  }


  __newEventNameInputChanged(event) {
    this._newEventName = event.detail.value;
  }


  async __newEventModalAddButtonClicked() {
    try {
      await this.clicked();
      await this.$.newEventModal.close();
      this.push('_targets', this._newEventName);
      this._selected     = this._newEventName;
      this._newEventName = '';
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

 
  async __targetButtonClicked(event) {
    try {
      await this.clicked();
      const {target} = event.model;
      this._selected = target;
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __handleSortFinished() {
    this._eventsOrder = this.selectAll('.sortable').map(btn => btn.target);
  }


  __eventItemDeleted(event) {
    const {target} = event.detail;
    const remainingTargets = this._targets.filter(eventName => eventName !== target);
    this._selected = '';
    this.set('_targets', remainingTargets);
    this.$.eventItem.reset();
  }

}

window.customElements.define(SpritefulCmsEvents.is, SpritefulCmsEvents);
