import {getTargetMonth, TripInfo} from './components/trip-info';
import Menu from './components/menu';
import Filters from './components/filters';
import NoPoints from "./components/no-points";
import {menus, filters, sortedWaypoints} from './data';
import {renderComponent, unrenderComponent} from "./utils";
import TripController from "./controllers/trip-controller";

const tripInfoContainer = document.querySelector(`.trip-info`);
const controlsContainer = document.querySelector(`.trip-controls`);
const mainContainer = document.querySelector(`.trip-events`);
const tripCostValue = document.querySelector(`.trip-info__cost-value`);

/**
 * @param { [ { offers: Set < {} >,
 *             city: string,
 *             description: string,
 *             time: {
 *               duration: {
 *                 days: string,
 *                 hours: string,
 *                 minutes: string
 *               },
 *               endTime: number,
 *               startTime: number
 *             },
 *             type: {
 *               address: string,
 *               template: string
 *             },
 *             waypointPrice: number,
 *             photos: [string] } ] } waypointList
 * @return {number}
 */
const getTripCostValue = (waypointList) => {
  let sum = 0;
  const additionalOffersPrice = document.querySelectorAll(`.event__offer-price`);

  waypointList.forEach((it) => {
    sum += it.waypointPrice;
  });

  additionalOffersPrice.forEach((it) => {
    sum += parseInt(it.textContent, 10);
  });

  return sum;
};

/**
 * @return { [ {
 *   tripDay: number,
 *   day: number,
 *   month: string,
 *   dayCode: number
 *        } ] }
 */
const getDaysData = () => {
  let dates = [];

  if (sortedWaypoints.length) {
    let currentTripDay = 1;
    let oldStateDate = new Date(sortedWaypoints[0].time.startTime).getDate();
    let oldStateMonth = new Date(sortedWaypoints[0].time.startTime).getMonth();

    sortedWaypoints.forEach((it) => {
      if ((new Date(it.time.startTime).getDate() !== oldStateDate) || (new Date(it.time.startTime).getMonth() !== oldStateMonth)) {
        currentTripDay++;
      }

      dates.push({
        tripDay: currentTripDay,
        day: new Date(it.time.startTime).getDate(),
        month: getTargetMonth(new Date(it.time.startTime).getMonth()),
        dayCode: it.time.startTime
      });
      oldStateDate = new Date(it.time.startTime).getDate();
      oldStateMonth = new Date(it.time.startTime).getMonth();
    });
  }
  return dates;
};

const generatePageElements = () => {
  const checkTasksState = () => {
    const boardContainer = mainContainer.querySelector(`.trip-days`);

    if (boardContainer.firstElementChild.childElementCount === 0) {
      Array.from(mainContainer.children).forEach((it) => {
        unrenderComponent(it);
      });
      renderComponent(mainContainer, new NoPoints().getElement(), `beforeend`);
    }
  };

  renderComponent(tripInfoContainer, new TripInfo().getElement(), `afterbegin`);
  renderComponent(controlsContainer, new Menu(menus).getElement(), `beforeend`);
  renderComponent(controlsContainer, new Filters(filters).getElement(), `beforeend`);

  const tripDaysData = getDaysData();
  const tripController = new TripController(mainContainer, sortedWaypoints, tripDaysData);

  tripController.init();
  tripCostValue.textContent = `${getTripCostValue(sortedWaypoints)}`;
  checkTasksState();
};

generatePageElements();
