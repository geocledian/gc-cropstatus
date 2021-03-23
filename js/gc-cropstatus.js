/*
 Vue.js Geocledian cropstatus component
 created: 2019-11-04, jsommer
 last update: 2020-06-22, Tarun
 version: 0.9.1
*/
"use strict";

//language strings
const gcCropstatusLocales = {
  "en": {
    "options": { "title": "Crop status" },
    "description": { 
      "id": "ID",
      "parcel": "Parcel",
      "sdate": "Sensing date"
    },
    "legend" : { 
      "uncultivated_area" : "uncultivated area",
      "area_under_crops" : "area under crops",
      "fraction_under_crops" : "fraction under crops",
    }
  },
  "de": {
    "options": { "title": "Feldzustand" },
    "description": { 
      "id": "Nr",
      "parcel": "Feld",
      "sdate": "Aufnahmedatum"
    },
    "legend" : { 
      "uncultivated_area" : "unbewirtschaftete Fläche",
      "area_under_crops" : "bewirtschaftete Fläche",
      "fraction_under_crops" : "Anteil bewirtschafteter Fläche",
    }
  },
}

Vue.component('gc-cropstatus', {
  props: {
    gcWidgetId: {
      type: String,
      default: 'cropstatus1',
      required: true
    },
    gcApikey: {
      type: String,
      default: '39553fb7-7f6f-4945-9b84-a4c8745bdbec'
    },
    gcHost: {
      type: String,
      default: 'geocledian.com'
    },
    gcProxy: {
      type: String,
      default: undefined
    },
    gcApiBaseUrl: {
      type: String,
      default: "/agknow/api/v3"
    },
    gcApiSecure: {
      type: Boolean,
      default: true
    }, 
    gcParcelId: {
      default: -1
    },
    gcSelectedDate: {
      type: String,
      default: "" // date for sending against the API
    },
    gcMode: {
      type: String,
      default: "gauge" // "pie" || "gauge" || "donut"
    },
    gcAvailableOptions: {
      type: String,
      default: "title,description,dateSelector,legend" // available options
    },
    gcWidgetCollapsed: {
      type: Boolean,
      default: true // or true
    },
    gcLanguage: {
      type: String,
      default: 'en' // 'en' | 'de'
    },
    gcLegendPosition: {
      type: String,
      default: 'inset' // 'bottom', 'right' or 'inset'
    },
    gcWhiteLabel: {
      type: Boolean,
      default: false // true or false
    }
  },
  template: `<div :id="gcWidgetId" class="gc-cropstatus" style="max-width: 18.0rem; min-width: 8rem;">       

              <p class="gc-options-title is-size-6 is-orange" style="cursor: pointer;" 
                v-on:click="toggleCropstatus"   
                v-show="this.availableOptions.includes('title')">
                {{ $t('options.title') }}
                <i :class="[gcWidgetCollapsed ? '': 'is-active', 'fas', 'fa-angle-down', 'fa-sm']"></i>
              </p>
              <div :class="[gcWidgetCollapsed ? '': 'is-hidden']">
               <div class="is-flex">
                <div :id="'desc_' + gcWidgetId" class="is-grey" v-show="this.availableOptions.includes('description')">
                  <!-- span :id="'title_' + gcWidgetId" class="has-text-weight-bold is-size-6">Crop status</span><br -->
                  <span :id="'subtitle_' + gcWidgetId" class="has-text-weight-bold is-size-7">{{ $t('description.parcel') }} {{ $t('description.id') }} :{{this.currentParcelID}}</span><br>
                  <span :id="'sdate_' + gcWidgetId" class="is-size-7" v-if="this.crop_status.hasOwnProperty('crop_status')">{{ $t('description.sdate') }}:{{this.crop_status.crop_status.sensing_date}}</span>
                </div>

                <div class="field-body is-horizontal" style="margin-left: 1em;"
                    v-show="this.availableOptions.includes('dateSelector')">
                  <div class="control has-icons-left" style="padding-bottom: 0px; max-width: 6.4rem;">
                    <input :id="'inpSdate_'+this.gcWidgetId" type="text" class="input is-small" placeholder="[YYYY-MM-DD]"
                      v-model="selectedDate">
                    <span class="icon is-small is-left">
                      <i class="fas fa-clock fa-lg"></i>
                    </span>
                  </div>
                </div>
                </div>
                <!-- watermark -->
                <div :class="[this.gcWhiteLabel ? 'is-hidden': 'is-inline-block', 'is-pulled-right']"
                  style="opacity: 0.65;">
                  <span style="vertical-align: top; font-size: 0.7rem;">powered by</span><br>
                  <img src="img/logo.png" alt="geo|cledian" style="width: 100px; margin: -10px 0;">
                </div>
               </div>

                <div :id="'chartNotice_'+gcWidgetId" class="content is-hidden"></div>

                <div :id="'chartSpinner_'+gcWidgetId" class="chartSpinner spinner is-hidden">
                  <div class="rect1"></div>
                  <div class="rect2"></div>
                  <div class="rect3"></div>
                  <div class="rect4"></div>
                  <div class="rect5"></div>
                </div>

                <div style="position: relative;">
                  <div :id="'chart_'+gcWidgetId" :class="['gc-cropstatus-chart-'+this.gcMode]" style="max-height: 160px!important;">
                  </div>
                </div>
              </div>
          </div>
          <!-- chart -->`,
  data: function () {
    return {
      chart: undefined,
      parcels: [],
      apiKey: this.gcApikey,
      apiHost: this.gcHost,
      apiUrl: "https://" + this.gcHost +"/agknow/api/v3",
      offset: 0,
      pagingStep: 6000,
      total_parcel_count: 250,
      crop_status : {},
      inpSdatePicker: undefined,
      internalSelectedDate: "", //for internal use only
    }
  },
  computed: {
    apiKey: {
      get: function () {
          return this.gcApikey;
      }
    },
    apiHost: {
        get: function () {
            return this.gcHost;
        }
    },
    apiBaseUrl: {
        get: function () {
            return this.gcApiBaseUrl;
      }
    },
    apiSecure: {
      get: function () {
          return this.gcApiSecure;
      }
    },
    currentParcelID:  {
      get: function() {
          return this.gcParcelId;
      },
      set: function(newValue) {
        this.gcParcelId = newValue;
      }
    },
    // chartWidth: function() {
    //     console.debug("clientwidth "+document.getElementById(this.gcWidgetId).clientWidth);
    //     console.debug("offsetwidth "+document.getElementById(this.gcWidgetId).offsetWidth);
    //     return parseInt(document.getElementById(this.gcWidgetId).offsetWidth);
    // },
    // chartHeight: function() {
    //     console.debug("clientheight "+document.getElementById(this.gcWidgetId).clientHeight);
    //     console.debug("offsetheight "+document.getElementById(this.gcWidgetId).offsetHeight);
    //     //return parseInt(document.getElementById(this.gcWidgetId).offsetHeight);
    //     return parseInt(document.getElementById(this.gcWidgetId).style.height);
    // },
    selectedDate: {
      get: function() {
        // either outer selected date
        if (this.gcSelectedDate.length > 0) {
          if (this.isDateValid(this.gcSelectedDate))
            return this.gcSelectedDate;
        }// or internal selected date
        else {
          if (this.isDateValid(this.internalSelectedDate))
            return this.internalSelectedDate;
        }
      },
      set: function(value) {
        console.debug("selectedDate - setter: "+value);

        if (this.isDateValid(value)) {
          //should set gcSelectedDate from root to the new value
          this.$root.$emit("queryDateChange", value);
          this.internalSelectedDate = value;
        }
      }
    },
    availableOptions: {
      get: function() {
        return (this.gcAvailableOptions.split(","));
      }
    },
    currentLanguage: {
      get: function() {
        // will always reflect prop's value 
        return this.gcLanguage;
      },
    },
  },
  i18n: { 
    locale: this.currentLanguage,
    messages: gcCropstatusLocales
  },
  created: function () {
    console.debug("cropstatus! - created()");
    this.changeLanguage();
  },
  /* when vue component is mounted (ready) on DOM node */
  mounted: function () {

    try {
      this.changeLanguage();
    } catch (ex) {}

    //handle chart resizing
    //window.addEventListener('resize', this.triggerResize);

    //console.log(this);
    document.getElementById("chart_" + this.gcWidgetId).classList.add("is-hidden");
    document.getElementById("chartSpinner_" + this.gcWidgetId).classList.remove("is-hidden");

    /* init chart */
    this.chart = c3.generate({
      bindto: '#chart_'+this.gcWidgetId,
      // fixHeightResizing: true,
      // size: {
      //   width: this.chartWidth, 
      //   height: this.chartHeight
      // },
      data: {
        columns: [],
        type: this.gcMode, // 'gauge','pie' or 'donut'
      },
      legend: {
        hide: !this.availableOptions.includes('legend') ? ["area under crops", "uncultivated area", "fraction under crops"] : [],
        position: this.gcLegendPosition
      }
    });

    //initial loading data
    if (this.gcParcelId > 0) {
      this.currentParcelID = this.gcParcelId;
      this.handleCurrentParcelIDchange();
    }

    //init datepickers - load external Javascript file in this component
    // async and call the given function when ready
    if (this.availableOptions.includes('dateSelector')) {
      this.loadJSscript("css/bulma-ext/bulma-calendar.min.js", function() {

          this.inpSdatePicker = new bulmaCalendar( document.getElementById( 'inpSdate_'+this.gcWidgetId ), {
            startDate: new Date(Date.parse(this.selectedDate)), // Date selected by default
            dateFormat: 'yyyy-mm-dd', // the date format `field` value
            lang: this.currentLanguage, // internationalization
            overlay: false,
            closeOnOverlayClick: true,
            closeOnSelect: true,
            // callback functions
            onSelect: function (e) { 
                        // hack +1 day - don't know why we need this here - timezone?
                        var a = new Date(e.valueOf() + 1000*3600*24);
                        this.selectedDate = a.toISOString().split("T")[0]; //ISO String splits at T between date and time
                        }.bind(this),
          });
        }.bind(this)
      );
    }
  },
  watch: {
    currentParcelID: function (newValue, oldValue) {

      console.debug("event - currentParcelIDChange");

      this.handleCurrentParcelIDchange(newValue, oldValue);
    },
    selectedDate: function (newValue, oldValue) {

      console.debug("event - sdateChange");

      if (this.isDateValid(this.selectedDate)) {
        this.getCropStatus(this.getCurrentParcel().parcel_id, this.selectedDate);
      }
    },
    crop_status: {
      handler: function (newValue, oldValue) {

        console.debug("event - crop_statusChange");

        // create chart from values, if they change
        this.createChartData();
      },
      deep: true
    },
    currentLanguage(newValue, oldValue) {
      this.changeLanguage();
      //rebuild chart if language changed, otherwise localization will not refresh
      this.createChartData();
    },
    gcMode(newValue, oldValue) {
      // gauge shall always have bottom position for legend
      if (newValue === "gauge") {
        this.gcLegendPosition = "bottom";
      }
      this.createChartData();
    },
    gcLegendPosition(newValue, oldValue) {
      // gauge shall always have bottom position for legend
      if (newValue === "inset" && this.gcMode === "gauge") {
        this.gcLegendPosition = "bottom";
      }
      this.createChartData();
    },
  },
  methods: {
    getApiUrl: function (endpoint) {
      /* handles requests directly against  geocledian endpoints with API keys
          or (if gcProxy is set)
        also requests against the URL of gcProxy prop without API-Key; then
        the proxy or that URL has to add the api key to the requests against geocledian endpoints
      */
      let protocol = 'http';

      if (this.apiSecure) {
        protocol += 's';
      }

      // if (this.apiEncodeParams) {
      //   endpoint = encodeURIComponent(endpoint);
      // }
      
      // with or without apikey depending on gcProxy property
      return (this.gcProxy ? 
                protocol + '://' + this.gcProxy + this.apiBaseUrl + endpoint  : 
                protocol + '://' + this.gcHost + this.apiBaseUrl + endpoint + "?key="+this.apiKey);
    },
    toggleCropstatus: function () {
      this.gcWidgetCollapsed = !this.gcWidgetCollapsed;
    },
    // triggerResize: function () {
    //   console.debug("triggerResize()");

    //   /*console.log("clientwidth "+document.getElementById(this.gcWidgetId).clientWidth);
    //   console.log("offsetwidth "+document.getElementById(this.gcWidgetId).offsetWidth);*/
    //   //this.chart.resize();
    //   //this.chart.internal.selectChart.style('max-height', 'none');

    //   this.chart.resize({
    //             //height: document.getElementById(this.gcWidgetId).offsetHeight * 0.6, 
    //             width: document.getElementById(this.gcWidgetId).offsetWidth - 20
    //                     });

    // },
    handleCurrentParcelIDchange: function () {

      console.debug("methods - handleCurrentParcelIDchange");

      //only if valid parcel id
      if (this.currentParcelID > 0) {
      
        this.filterDetailData();

        this.getCropStatus(this.getCurrentParcel().parcel_id, this.selectedDate);
      }
    },
    //returns detailed data from REST service by passing the selected parcel_id
    filterDetailData: function () {

      console.debug("methods - filterDetailData");
      
    },
    getCurrentParcel: function () {
      return {parcel_id: this.currentParcelID};
    },
    getCropStatus: function(parcel_id, sdate) {
      // Code optimize

      this.hideMsg('');
      const endpoint = "/parcels/"+parcel_id+"/status";
      let params = "&sdate="+ sdate;
    
      //Show requests on the DEBUG console for developers
      console.debug("getCropStatus()");
      console.debug("GET " + this.getApiUrl(endpoint) + params);
  
      //clear chart
      this.chart.unload();

      // axios implemented start
      axios({
        method: 'GET',
        url: this.getApiUrl(endpoint) + params,
      }).then(function (response) {
        if(response.status === 200){
          try {
            var result  = response.data;
            if (result.content === "key is not authorized" || result.content === "api key validity expired") {
              this.showMsg(result.content)
              return;
            }
            var row = this.getCurrentParcel();
            if (result.hasOwnProperty("crop_status")) {
              this.crop_status = result;
            }
          } catch (err) {
            console.error(err);
            this.showMsg('');
          }
        }
      }.bind(this)).catch(err => {
        this.showMsg('');
      })
      // axios implemented end

    },
    createChartData: function() {

      console.debug("createChartData()");
  
      let columns = [];

      if (this.crop_status.hasOwnProperty("crop_status")) {
        if (this.gcMode == "pie" || this.gcMode == "donut") {
          // format values to 2 decimals
          columns[0] = ["area under crops"].concat(this.formatDecimal(this.crop_status.crop_status.area_under_crops, 2));
          // calculate relative uncultivated area from parcel's area and inverse fraction under crop
          const uncultivated_area = this.crop_status.summary.area * (1.0 - this.crop_status.crop_status.fraction_under_crops);
          columns[1] = ["uncultivated area"].concat(this.formatDecimal(uncultivated_area, 2));
        }
        if (this.gcMode == "gauge")  {
          // format values to 2 decimals
          columns[0] = ["fraction under crops"].concat(this.formatDecimal(this.crop_status.crop_status.fraction_under_crops *100, 2));
        }

        document.getElementById("chartSpinner_" + this.gcWidgetId).classList.add("is-hidden");
        document.getElementById("chart_" + this.gcWidgetId).classList.remove("is-hidden");
        document.getElementById("chartNotice_"+this.gcWidgetId).classList.add("is-hidden");

        this.createChart(columns);
      }
    },
    createChart: function(data) {

      let color_options = {};

      if (this.gcMode == "gauge") {
        color_options = {
          // four color levels for the percentage values: red (0-24%), orange (25-49%), yellow (50-74%), green (> 75%)
          pattern: ['#FF0000', '#F97600', '#F6C600', '#60B044'], 
          threshold: {
              // unit: 'value', // percentage is default
              max: 100, // 100 is default
              values: [25, 50, 75, 100]
          }
        };
      }
      let pie_options = {};
      let pie_color_options = {};

      if (this.gcMode == "pie" || this.gcMode == "donut") {
        pie_options = {
          label: {
              format: function (value, ratio, id) {
                  return this.formatDecimal(value, 1) + " ha";
              }.bind(this)
          }
        };
        pie_color_options = {"area under crops": '#60B044', "uncultivated area": '#FF0000' };
      }
  
      this.chart = c3.generate({
        bindto: '#chart_'+this.gcWidgetId,
        // size: {
        //   width: this.chartWidth,  
        //   height: this.chartHeight
        // },
        data: {
          columns: [],
          type: this.gcMode, 
          colors: pie_color_options,
          names: { //with i18n
            "uncultivated area": this.$t("legend.uncultivated_area"),
            "area under crops": this.$t("legend.area_under_crops"),
            "fraction under crops": this.$t("legend.fraction_under_crops"),
          },
        },
        pie: pie_options,
        color: color_options,
        transition: {
            duration: 500
        },
        legend: {
          hide: !this.availableOptions.includes('legend') ? ["area under crops", "uncultivated area", "fraction under crops"] : [],
          position: this.gcLegendPosition
        }
      });

      // toggles animation of chart
      this.chart.load({columns: data});

    },
    /* GUI helper */
    changeLanguage() {
      this.$i18n.locale = this.currentLanguage;
    },  
    /* helper functions */
    removeFromArray: function(arry, value) {
      let index = arry.indexOf(value);
      if (index > -1) {
          arry.splice(index, 1);
      }
      return arry;
    },
    formatDecimal: function(decimal, numberOfDecimals) {
      /* Helper function for formatting numbers to given number of decimals */
  
      var factor = 100;
  
      if ( isNaN(parseFloat(decimal)) ) {
          return NaN;
      }
      if (numberOfDecimals == 1) {
          factor = 10;
      }
      if (numberOfDecimals == 2) {
          factor = 100;
      }
      if (numberOfDecimals == 3) {
          factor = 1000;
      }
      if (numberOfDecimals == 4) {
          factor = 10000;
      }
      if (numberOfDecimals == 5) {
          factor = 100000;
      }
      return Math.ceil(decimal * factor)/factor;
    },
    capitalize: function (s) {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    isDateValid: function (date_str) {
      /* Validates a given date string */
      if (!isNaN(new Date(date_str))) {
          return true;
      }
      else {
          return false;
      }
    },
    loadJSscript: function (url, callback) {
      
      let script = document.createElement("script");  // create a script DOM node
      script.src = gcGetBaseURL() + "/" + url;  // set its src to the provided URL
      script.async = true;
      console.debug(script.src);
      document.body.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
      script.onload = function () {
        callback();
      };
    },

    showMsg : function (msg) {
      try { document.getElementById("sDate_"+this.gcWidgetId).classList.add("is-hidden"); } catch (ex) {}
      try { document.getElementById("desc_" + this.gcWidgetId).classList.add("is-hidden"); } catch (ex) {}

      if(msg === 'key is not authorized'){
        document.getElementById("chartNotice_" + this.gcWidgetId).innerHTML = "Sorry, the given API key is not authorized!<br> Please contact <a href='https://www.geocledian.com'>geo|cledian</a> for a valid API key.";
      }
      else if(msg === 'api key validity expired'){
        document.getElementById("chartNotice_" + this.gcWidgetId).innerHTML = "Sorry, the given API key's validity expired!<br> Please contact <a href='https://www.geocledian.com'>geo|cledian</a>for a valid API key.";
      } else{
        document.getElementById("chartNotice_" + this.gcWidgetId).innerHTML = "Sorry, an error occurred!<br>Please check the console log for more information.";
      }

      document.getElementById("chartNotice_" + this.gcWidgetId).classList.remove("is-hidden");
      document.getElementById("chartSpinner_" + this.gcWidgetId).classList.add("is-hidden");
    },

   hideMsg : function (msg) {
      try { document.getElementById("sDate_"+this.gcWidgetId).classList.remove("is-hidden"); } catch (ex) {}
      try { document.getElementById("desc_" + this.gcWidgetId).classList.remove("is-hidden"); } catch (ex) {}
      document.getElementById("chartNotice_"+this.gcWidgetId).classList.add("is-hidden");
      document.getElementById("chart_" + this.gcWidgetId).classList.add("is-hidden");
      document.getElementById("chartSpinner_" + this.gcWidgetId).classList.remove("is-hidden");
    }
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.triggerResize)
  }
});