import {getRandomNumber, Position, renderComponent, unrenderComponent, getDaysData, block} from "../utils";
import {getSortedByDateList} from "../data";
import CardBoard from "../components/card-board";
import Day from "../components/day-container";
import Sort from "../components/sort";
import PointController from "./point-controller";
import Statistics from "../components/statistics";
import {
  cities, TripControllerMode, waypointType, waypointTypeNames,
  MSECONDS_IN_SECOND, SECONDS_IN_MINUTE, MINUTES_IN_HOUR, waypointTransportTypeNames
} from "../constants";
import Chart from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import TripInfoController from "./trip-info-controller";
import NoPoints from "../components/no-points";

class TripController {
  /**
   * @param {Element} container
   * @param { [{duration: {hours: number, minutes: number, days: number},
   *            startTime: number,
   *            endTime: number}] } waypoints
   * @param { [ {
   *   tripDay: number,
   *   day: number,
   *   month: string,
   *   dayCode: number
   *        } ] } tripDaysData
   * @param { [{name: string, description: string, pictures: [ {src: string, description: string} ]}] } cityDescriptionData
   * @param { [{type: string, offers: [ {name: string, title: string, price: number} ]}] } tripTypeOffers
   * @param { {actionType: string,
   *           update:  { offers: Set < {} >,
   *             city: string,
   *             description: string,
   *             time: {
   *               duration: {
   *                 days: number,
   *                 hours: number,
   *                 minutes: number
   *               },
   *               endTime: number,
   *               startTime: number
   *             },
   *             type: {
   *               address: string,
   *               template: string
   *             },
   *             waypointPrice: number,
   *             photos: [string],
   *             isFavorite: boolean } } } onDataChange
   */
  constructor(container, waypoints, tripDaysData, cityDescriptionData, tripTypeOffers, onDataChange) {
    this._container = container;
    this._waypoints = waypoints;
    this._tripDaysData = tripDaysData;
    this._eventContainerIndex = 0;
    this._board = new CardBoard();
    this._sort = new Sort();
    this._onDataChangeMain = onDataChange;
    this._tripInfoController = new TripInfoController(this._waypoints);
    this._dayElement = new Day(tripDaysData).getElement();
    this._subscriptions = [];
    this._cityDescriptionData = cityDescriptionData;
    this._tripTypeOffers = tripTypeOffers;
    this._creatingWaypoint = null;
    this._noPointsElement = null;
    this._transportChart = null;
    this._moneyChart = null;
    this._timeChart = null;
    this._onDataChange = this._onDataChange.bind(this);
    this._onChangeView = this._onChangeView.bind(this);
  }

  init() {
    renderComponent(this._container, this._sort.getElement(), Position.BEFOREEND);
    renderComponent(this._container, this._board.getElement(), Position.BEFOREEND);
    renderComponent(this._board.getElement().firstElementChild, this._dayElement, Position.BEFOREEND);
    renderComponent(this._container, new Statistics().getElement(), Position.BEFOREEND);

    this._waypoints.forEach((it, dayIndex) => {
      if ((dayIndex > 0) && (this._tripDaysData[dayIndex].tripDay !== this._tripDaysData[dayIndex - 1].tripDay)) {
        this._eventContainerIndex++;
      }

      this._renderTripWaypoint(it, this._eventContainerIndex);
    });
    this._tripInfoController.updateTripInfo(this._waypoints);

    this._sort.getElement().querySelector(`.trip-sort`).addEventListener(`click`, (evt) => this._onSortElementClick(evt));
  }

  unrenderTripBoard() {
    this._container.innerHTML = ``;
  }

  /**
   * @param {{duration: {hours: number, minutes: number, days: number},
   *            startTime: number,
   *            endTime: number}} tripWaypoint
   * @param {number} containerIndex
   * @private
   */
  _renderTripWaypoint(tripWaypoint, containerIndex) {
    const pointController = new PointController(this._dayElement.querySelectorAll(`.trip-events__list`)[containerIndex], tripWaypoint, TripControllerMode.DEFAULT, this._onDataChange, this._onChangeView, this._cityDescriptionData, this._tripTypeOffers);

    this._subscriptions.push(pointController.setDefaultView.bind(pointController));
  }

  _createTripWaypoint() {
    if (this._creatingWaypoint !== null) {
      return;
    }

    const defaultWaypoint = {
      type: waypointType[waypointTypeNames[getRandomNumber(0, waypointTypeNames.length - 1)]],
      city: this._cityDescriptionData.map((it) => it.name)[getRandomNumber(0, cities.length - 1)],
      waypointPrice: 0,
      time: {
        startTime: new Date(),
        endTime: new Date(),
      },
      isFavorite: false,
      id: this._waypoints.length,
    };
    defaultWaypoint.photos = this._cityDescriptionData.find((it) => it.name === defaultWaypoint.city).pictures;
    defaultWaypoint.description = this._cityDescriptionData.find((it) => it.name === defaultWaypoint.city).description;

    const offerKey = Object.keys(waypointType).find((it) => waypointType[it] === defaultWaypoint.type);

    defaultWaypoint.offers = this._tripTypeOffers.find((it) => it.type === offerKey).offers;
    this._creatingWaypoint = new PointController(this._board.getElement().firstElementChild, defaultWaypoint, TripControllerMode.ADDING, this._onDataChange, this._onChangeView, this._cityDescriptionData, this._tripTypeOffers);
    if (this._container.querySelector(`.trip-days`).children[1].children.length === 0) {
      unrenderComponent(this._noPointsElement);
    }
  }

  _setNewWaypointStatus() {
    this._creatingWaypoint = null;
  }

  /**
   * @param { { offers: Set < {} >,
   *             city: string,
   *             description: string,
   *             time: {
   *               duration: {
   *                 days: number,
   *                 hours: number,
   *                 minutes: number
   *               },
   *               endTime: number,
   *               startTime: number
   *             },
   *             type: {
   *               address: string,
   *               template: string
   *             },
   *             waypointPrice: number,
   *             photos: [string],
   *             isFavorite: boolean } } newData
   * @param { { offers: Set < {} >,
   *             city: string,
   *             description: string,
   *             time: {
   *               duration: {
   *                 days: number,
   *                 hours: number,
   *                 minutes: number
   *               },
   *               endTime: number,
   *               startTime: number
   *             },
   *             type: {
   *               address: string,
   *               template: string
   *             },
   *             waypointPrice: number,
   *             photos: [string],
   *             isFavorite: boolean } } oldData
   * @private
   */
  _onDataChange(newData, oldData) {
    if (oldData !== null && newData !== null) {
      block(`Save`);
      setTimeout(() => {
        this._waypoints[this._waypoints.findIndex((it) => it === oldData)] = newData;
        this._onDataChangeMain(`update`, this._waypoints[this._waypoints.findIndex((it) => it === newData)]);
      }, 1000);
    }
    if (newData === null) {
      block(`Delete`);
      setTimeout(() => {
        this._onDataChangeMain(`delete`, this._waypoints[this._waypoints.findIndex((it) => it === oldData)]);
        this._waypoints.splice(this._waypoints.findIndex((it) => it === oldData), 1);
        this._tripDaysData = getDaysData(this._waypoints);
        if (this._waypoints.length === 0) {
          this._noPointsElement = new NoPoints().getElement();
          renderComponent(this._container, this._noPointsElement, Position.BEFOREEND);
          unrenderComponent(this._sort.getElement());
        }
      }, 1000);
    }
    if (oldData === null) {
      setTimeout(() => {
        this._onDataChangeMain(`create`, newData);
        this._waypoints.unshift(newData);
        this._waypoints.sort(getSortedByDateList);
        this._tripDaysData = getDaysData(this._waypoints);
        this._creatingWaypoint = null;
        if (this._container.querySelector(`.trip-days`).children[1].children.length === 0) {
          renderComponent(this._container, this._sort.getElement(), Position.AFTERBEGIN);
        }
      }, 1000);
    }
    setTimeout(() => {
      unrenderComponent(this._board.getElement());
      this._board = new CardBoard();
      renderComponent(this._container, this._board.getElement(), Position.BEFOREEND);
      this._dayElement = new Day(this._tripDaysData).getElement();
      renderComponent(this._board.getElement().firstElementChild, this._dayElement, Position.BEFOREEND);
      this._eventContainerIndex = 0;
      this._waypoints.forEach((it, dayIndex) => {
        if ((dayIndex > 0) && (this._tripDaysData[dayIndex].tripDay !== this._tripDaysData[dayIndex - 1].tripDay)) {
          this._eventContainerIndex++;
        }
        this._renderTripWaypoint(it, this._eventContainerIndex);
      });
      this._tripInfoController.updateTripInfo(this._waypoints);
    }, 1000);
  }

  _onChangeView() {
    this._subscriptions.forEach((subscription) => subscription());
  }

  /**
   * @param {Event} evt
   * @private
   */
  _onSortElementClick(evt) {
    const clearDaysData = () => {
      document.querySelectorAll(`.day__counter`).forEach((it) => {
        unrenderComponent(it);
      });
      document.querySelectorAll(`.day__date`).forEach((it) => {
        unrenderComponent(it);
      });
    };

    if (evt.target.tagName !== `INPUT`) {
      return;
    }
    unrenderComponent(this._board.getElement());
    this._board = new CardBoard();
    renderComponent(this._container, this._board.getElement(), Position.BEFOREEND);
    this._dayElement = new Day(this._tripDaysData).getElement();
    this._eventContainerIndex = 0;
    renderComponent(this._board.getElement().firstElementChild, this._dayElement, Position.BEFOREEND);

    switch (evt.target.dataset.sortType) {
      case `event`:
        this._waypoints.forEach((it, index) => {
          if ((index > 0) && (this._tripDaysData[index].tripDay !== this._tripDaysData[index - 1].tripDay)) {
            this._eventContainerIndex++;
          }
          this._renderTripWaypoint(it, this._eventContainerIndex);
        });
        break;

      case `time`:
        this._waypoints.slice()
          .sort((a, b) => (parseInt(a.time.duration.days, 10) - parseInt(b.time.duration.days, 10)) || (parseInt(a.time.duration.hours, 10) - parseInt(b.time.duration.hours, 10)) || (parseInt(a.time.duration.minutes, 10) - parseInt(b.time.duration.minutes, 10)))
          .forEach((it, index) => {
            if ((index > 0) && (this._tripDaysData[index].tripDay !== this._tripDaysData[index - 1].tripDay)) {
              this._eventContainerIndex++;
            }
            this._renderTripWaypoint(it, this._eventContainerIndex);
          });
        clearDaysData();
        break;

      case `price`:
        this._waypoints.slice().sort((a, b) => a.waypointPrice - b.waypointPrice).forEach((it, index) => {
          if ((index > 0) && (this._tripDaysData[index].tripDay !== this._tripDaysData[index - 1].tripDay)) {
            this._eventContainerIndex++;
          }
          this._renderTripWaypoint(it, this._eventContainerIndex);
        });
        clearDaysData();
        break;
    }
  }

  _showStatistics(waypoints) {
    Chart.defaults.global.defaultFontColor = `#000000`;
    Chart.defaults.global.defaultFontSize = 14;
    const moneyCtx = this._container.querySelector(`.statistics__chart--money`);
    const transportCtx = this._container.querySelector(`.statistics__chart--transport`);
    const timeCtx = this._container.querySelector(`.statistics__chart--time`);
    this._moneyChart = new Chart(moneyCtx, {
      type: `horizontalBar`,
      plugins: [ChartDataLabels],
      data: {
        labels: waypointTypeNames.filter((name) => {
          return waypoints.some((it) => {
            return it.type === waypointType[name];
          });
        }).map((filteredName) => filteredName.toUpperCase()),
        datasets: [{
          data: waypointTypeNames.map((name) => {
            let sum = 0;

            waypoints.forEach((it) => {
              if (it.type === waypointType[name]) {
                sum += it.waypointPrice;
              }
            });

            return sum;
          }).filter((sum) => sum !== 0),
          backgroundColor: `#ffffff`,
        }]
      },
      options: {
        title: {
          display: true,
          text: `MONEY`,
          position: `left`,
          fontSize: 30,
          padding: 30,
          fontColor: `#000000`
        },
        plugins: {
          datalabels: {
            display: true,
            anchor: `end`,
            align: `start`,
            padding: 10,
            formatter(value) {
              return `€ ${value}`;
            },
          }
        },
        scales: {
          yAxes: [{
            barPercentage: 1.1,
            gridLines: {
              display: false,
              drawBorder: false
            }
          }],
          xAxes: [{
            minBarLength: 50,
            ticks: {
              display: false,
              beginAtZero: true
            },
            gridLines: {
              display: false,
              drawBorder: false
            }
          }]
        },
        legend: {
          display: false,
        },
        layout: {
          paddingTop: 10
        },
        tooltips: {
          enabled: true
        }
      },
    });
    this._transportChart = new Chart(transportCtx, {
      type: `horizontalBar`,
      plugins: [ChartDataLabels],
      data: {
        labels: waypointTransportTypeNames.filter((name) => {
          return waypoints.some((it) => {
            return it.type === waypointType[name];
          });
        }).map((filteredName) => filteredName.toUpperCase()),
        datasets: [{
          data: waypointTypeNames.map((name) => {
            let sum = 0;

            waypoints.forEach((it) => {
              if (it.type === waypointType[name]) {
                sum++;
              }
            });

            return sum;
          }).filter((sum) => sum !== 0),
          backgroundColor: `#ffffff`,
        }]
      },
      options: {
        title: {
          display: true,
          text: `TRANSPORT`,
          position: `left`,
          fontSize: 30,
          padding: 30,
          fontColor: `#000000`
        },
        plugins: {
          datalabels: {
            display: true,
            anchor: `end`,
            align: `start`,
            padding: 10,
            formatter(value) {
              return `${value}x`;
            },
          }
        },
        scales: {
          yAxes: [{
            barPercentage: 1.1,
            gridLines: {
              display: false,
              drawBorder: false
            }
          }],
          xAxes: [{
            minBarLength: 50,
            ticks: {
              display: false,
              beginAtZero: true
            },
            gridLines: {
              display: false,
              drawBorder: false
            }
          }]
        },
        legend: {
          display: false,
        },
        layout: {
          paddingTop: 10
        },
        tooltips: {
          enabled: true
        }
      },
    });
    const destinations = [...new Set(waypoints.map((it) => {
      return it.city;
    }))];
    this._timeChart = new Chart(timeCtx, {
      type: `horizontalBar`,
      plugins: [ChartDataLabels],
      data: {
        labels: destinations,
        datasets: [{
          data: destinations.map((name, index) => {
            let sum = 0;

            waypoints.forEach((it) => {
              if (it.city === destinations[index]) {
                sum += it.time.endTime - it.time.startTime;
              }
            });

            return sum;
          }),
          data1: waypointTypeNames.map((name) => {
            let sum = 0;

            waypoints.forEach((it) => {
              if (it.type === waypointType[name]) {
                sum += it.time.endTime - it.time.startTime;
              }
            });

            return sum;
          }).filter((result) => result !== 0),
          backgroundColor: `#ffffff`,
        }]
      },
      options: {
        title: {
          display: true,
          text: `TIME SPENT`,
          position: `left`,
          fontSize: 30,
          padding: 30,
          fontColor: `#000000`
        },
        plugins: {
          datalabels: {
            display: true,
            anchor: `end`,
            align: `start`,
            padding: 10,
            formatter(value) {
              return `${parseInt(value / MSECONDS_IN_SECOND / SECONDS_IN_MINUTE / MINUTES_IN_HOUR, 10)}H`;
            },
          }
        },
        scales: {
          yAxes: [{
            barPercentage: 1.1,
            gridLines: {
              display: false,
              drawBorder: false
            }
          }],
          xAxes: [{
            minBarLength: 50,
            ticks: {
              display: false,
              beginAtZero: true
            },
            gridLines: {
              display: false,
              drawBorder: false
            }
          }]
        },
        legend: {
          display: false,
        },
        layout: {
          paddingTop: 10
        },
        tooltips: {
          enabled: true,
        }
      },
    });

    this._container.querySelector(`.statistics`).classList.remove(`visually-hidden`);
    this._board.getElement().classList.add(`visually-hidden`);
    this._sort.getElement().classList.add(`visually-hidden`);
  }

  _hideStatistics() {
    this._container.querySelector(`.statistics`).classList.add(`visually-hidden`);
    this._board.getElement().classList.remove(`visually-hidden`);
    this._sort.getElement().classList.remove(`visually-hidden`);
    if (this._transportChart !== null) {
      this._transportChart.destroy();
      this._moneyChart.destroy();
      this._timeChart.destroy();
    }
  }
}

export default TripController;
