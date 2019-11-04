/**
 * `cms-event-card`
 * display event image and name as an interactive element
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {
  AppElement, 
  html
}                 from '@longlost/app-element/app-element.js';
import htmlString from './cms-event-card.html';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-ripple/paper-ripple.js';


class EventCard extends AppElement {
  static get is() { return 'cms-event-card'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {
      
      item: Object

    };
  }


  __computeImg(images) {
    if (!images) { return '#'; }
    const values = Object.values(images);
    const urls = values.
      reduce((accum, val) => {
        const {index, thumbnail, url} = val;      
        accum[index] = thumbnail ? thumbnail : url;
        return accum;
      }, []).
      filter(url => typeof url === 'string');
    return urls[0];
  }

}

window.customElements.define(EventCard.is, EventCard);
