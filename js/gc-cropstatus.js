/*
 Vue.js Geocledian cropstatus component
 created: 2019-11-04, jsommer
 last update: 2020-02-21, jsommer
 version: 0.9
*/
"use strict";

Vue.component('gc-cropstatus', {
  props: {
    chartid: {
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
    gcParcelId: {
      default: -1
    },
    sdate: {
      type: String,
      default: ""
    },
    mode: {
      type: String,
      default: "gauge" // "pie" || "gauge" || "donut"
    },
    showOptions: {
      type: String,
      default: "false" // unused currently
    },
    showDateSelector: {
      type: String,
      default: "true" // show or hide the date selector
    },
    showTitleBlock: {
      type: String,
      default: "true" // show or hide title block with base information
    }
  },
  template: `<div :id="chartid" class="gc-cropstatus" style="max-width: 18.0rem;">          
            
            <p class="chartOptionsTitle is-size-6 is-orange is-inline-block" style="margin-bottom: 1.0rem; cursor: pointer;" 
                v-on:click="toggleChartOptions" v-if="this.showOptions == 'true'">
               Chart options 
              <i class="fas fa-angle-down fa-sm"></i>
            </p>

            <div :id="'chartOptions_'+chartid" class="chartOptions is-horizontal is-flex is-hidden"
                  style="max-height: 6.6rem !important;">
            </div><!-- chart options -->

            <div>
              <div :id="'titleBlock_' + chartid" class="is-grey is-inline-block" v-if="showTitleBlock == 'true'">
                <span :id="'title_' + chartid" class="has-text-weight-bold is-size-6">Crop status</span><br>
                <span :id="'subtitle_' + chartid"class="has-text-weight-bold is-size-7">Parcel ID: {{this.currentParcelID}}</span><br>
                <span :id="'sdate_' + chartid"class="is-size-7" v-if="this.crop_status.hasOwnProperty('crop_status')">Sensing date: {{this.crop_status.crop_status.sensing_date}}</span>
              </div>

              <div :id="'sDate_'+this.chartid" class="field-body is-horizontal is-inline-block is-pulled-right" style="vertical-align: top;" v-if="showDateSelector=='true'">
                <div class="control has-icons-left" style="padding-bottom: 10px; max-width: 6.4rem;">
                  <input :id="'inpSdate_'+this.chartid" type="text" class="input is-small"
                  placeholder="[YYYY-MM-DD]" v-model="sdate">
                  <span class="icon is-small is-left">
                    <i class="fas fa-clock fa-lg"></i>
                  </span>
                </div>
              </div>
              <!-- watermark -->
              <div class="is-pulled-right is-inline-block" style="opacity: 0.65;">
                <span style="verticalalign: top; font-size: 0.7rem;">powered by</span><br>
                <img src="img/logo.png" alt="geo|cledian" style="width: 100px; margin: -10px 0;">
              </div>
            </div>

            <div :id="'chartNotice_'+chartid" class="content is-hidden"></div>
            
            <div :id="'chartSpinner_'+chartid" class="chartSpinner spinner is-hidden">
              <div class="rect1"></div>
              <div class="rect2"></div>
              <div class="rect3"></div>
              <div class="rect4"></div>
              <div class="rect5"></div>
            </div>


          <div style="position: relative;">
            <div :id="'chart_'+chartid" class="">
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
      chartLegendVisible: true,
      crop_status : {},
      inpSdatePicker: undefined,
    }
  },
  computed: {
    currentParcelID:  {
      get: function() {
          return this.gcParcelId;
      },
      set: function(newValue) {
        this.gcParcelId = newValue;
      }
    },
    chartWidth: function() {
        console.debug("clientwidth "+document.getElementById(this.chartid).clientWidth);
        console.debug("offsetwidth "+document.getElementById(this.chartid).offsetWidth);
        return parseInt(document.getElementById(this.chartid).offsetWidth);
    },
    chartHeight: function() {
        console.debug("clientheight "+document.getElementById(this.chartid).clientHeight);
        console.debug("offsetheight "+document.getElementById(this.chartid).offsetHeight);
        //return parseInt(document.getElementById(this.chartid).offsetHeight);
        return parseInt(document.getElementById(this.chartid).style.height);
    },
  },
  created: function () {},
  /* when vue component is mounted (ready) on DOM node */
  mounted: function () {

    //handle chart resizing
    window.addEventListener('resize', this.triggerResize);

    //console.log(this);
    document.getElementById("chart_" + this.chartid).classList.add("is-hidden");
    document.getElementById("chartSpinner_" + this.chartid).classList.remove("is-hidden");

    /* init chart */
    this.chart = c3.generate({
      bindto: '#chart_'+this.chartid,
      size: {
        width: this.chartWidth, 
        height: this.chartHeight
      },
      data: {
        columns: [],
        type: this.mode, // 'gauge','pie' or 'donut'
      }
    });

    //initial loading data
    if (this.gcParcelId > 0) {
      this.currentParcelID = this.gcParcelId;
      this.handleCurrentParcelIDchange();
    }

    //init datepickers - load external Javascript file in this component
    // async and call the given function when ready
    if (this.showDateSelector === 'true') {
      this.loadJSscript("css/bulma-ext/bulma-calendar.min.js", function() {

          this.inpSdatePicker = new bulmaCalendar( document.getElementById( 'inpSdate_'+this.chartid ), {
            startDate: new Date(Date.parse(this.sdate)), // Date selected by default
            dateFormat: 'yyyy-mm-dd', // the date format `field` value
            lang: 'en', // internationalization
            overlay: false,
            closeOnOverlayClick: true,
            closeOnSelect: true,
            // callback functions
            onSelect: function (e) { 
                        // hack +1 day - don't know why we need this here - timezone?
                        var a = new Date(e.valueOf() + 1000*3600*24);
                        this.sdate = a.toISOString().split("T")[0]; //ISO String splits at T between date and time
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
    sdate: function (newValue, oldValue) {

      console.debug("event - sdateChange");

      if (this.isDateValid(this.sdate)) {
        this.getCropStatus(this.getCurrentParcel().parcel_id, this.sdate);
      }
    },
    crop_status: {
      handler: function (newValue, oldValue) {

        console.debug("event - crop_statusChange");

        // create chart from values, if they change
        this.createChartData();
      },
      deep: true
    }
  },
  methods: {
    triggerResize: function () {
      console.debug("triggerResize()");

      /*console.log("clientwidth "+document.getElementById(this.chartid).clientWidth);
      console.log("offsetwidth "+document.getElementById(this.chartid).offsetWidth);*/
      //this.chart.resize();
      //this.chart.internal.selectChart.style('max-height', 'none');

      this.chart.resize({
                //height: document.getElementById(this.chartid).offsetHeight * 0.6, 
                width: document.getElementById(this.chartid).offsetWidth - 20
                        });

    },
    handleCurrentParcelIDchange: function () {

      console.debug("methods - handleCurrentParcelIDchange");

      //only if valid parcel id
      if (this.currentParcelID > 0) {
      
        this.filterDetailData();

        this.getCropStatus(this.getCurrentParcel().parcel_id, this.sdate);
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

      try { document.getElementById("sDate_"+this.chartid).classList.remove("is-hidden"); } catch (ex) {}
      try { document.getElementById("titleBlock_" + this.chartid).classList.remove("is-hidden"); } catch (ex) {}
      document.getElementById("chartNotice_"+this.chartid).classList.add("is-hidden");
      document.getElementById("chart_" + this.chartid).classList.add("is-hidden");
      document.getElementById("chartSpinner_" + this.chartid).classList.remove("is-hidden");
  
      const productName = "status";
      
      var params = "/parcels/"+parcel_id+"/"+ productName +"?key="+
                      this.apiKey +"&sdate="+ sdate;
    
      var xmlHttp = new XMLHttpRequest();
      var async = true;
  
      //Show requests on the DEBUG console for developers
      console.debug("getCropStatus()");
      console.debug("GET " + this.apiUrl + params);
  
      //clear chart
      this.chart.unload();
  
      xmlHttp.onreadystatechange=function()
      {
        if (xmlHttp.readyState==4)
        {
          //console.log(xmlHttp.responseText);
          try {
            var tmp  = JSON.parse(xmlHttp.responseText);

            if (tmp.content == "key is not authorized") {
              // show message, hide spinner
              try { document.getElementById("sDate_"+this.chartid).classList.add("is-hidden"); } catch (ex) {}
              try { document.getElementById("titleBlock_" + this.chartid).classList.add("is-hidden"); } catch (ex) {}
              document.getElementById("chartNotice_" + this.chartid).innerHTML = "Sorry, the given API key is not authorized!<br> Please contact <a href='https://www.geocledian.com'>geo|cledian</a> for a valid API key.";
              document.getElementById("chartNotice_" + this.chartid).classList.remove("is-hidden");
              document.getElementById("chartSpinner_" + this.chartid).classList.add("is-hidden");
              return;
            }
            if (tmp.content == 	"api key validity expired") {
                // show message, hide spinner
                try { document.getElementById("sDate_"+this.chartid).classList.add("is-hidden"); } catch (ex) {}
                try { document.getElementById("titleBlock_" + this.chartid).classList.add("is-hidden"); } catch (ex) {}
                document.getElementById("chartNotice_" + this.chartid).innerHTML = "Sorry, the given API key's validity expired!<br> Please contact <a href='https://www.geocledian.com'>geo|cledian</a>for a valid API key.";
                document.getElementById("chartNotice_" + this.chartid).classList.remove("is-hidden");
                document.getElementById("chartSpinner_" + this.chartid).classList.add("is-hidden");
                return;
            }
            
            var row = this.getCurrentParcel();
            
            if (tmp.hasOwnProperty("crop_status")) {
              this.crop_status = tmp;
            }
          } catch (err) {
            console.error(err);
            try { document.getElementById("sDate_"+this.chartid).classList.add("is-hidden"); } catch (ex) {}
            try { document.getElementById("titleBlock_" + this.chartid).classList.add("is-hidden"); } catch (ex) {}
            document.getElementById("chartNotice_" + this.chartid).innerHTML = "Sorry, an error occurred!<br>Please check the console log for more information.";
            document.getElementById("chartNotice_" + this.chartid).classList.remove("is-hidden");
            document.getElementById("chartSpinner_" + this.chartid).classList.add("is-hidden");
          }
        }
      }.bind(this);

      xmlHttp.open("GET", this.apiUrl + params, async);
      xmlHttp.send();
    },
    createChartData: function() {

      console.debug("createChartData()");
  
      let columns = [];

      if (this.crop_status.hasOwnProperty("crop_status")) {
        if (this.mode == "pie" || this.mode == "donut") {
          // format values to 2 decimals
          columns[0] = ["area under crops"].concat(this.formatDecimal(this.crop_status.crop_status.area_under_crops, 2));
          // calculate relative uncultivated area from parcel's area and inverse fraction under crop
          const uncultivated_area = this.crop_status.summary.area * (1.0 - this.crop_status.crop_status.fraction_under_crops);
          columns[1] = ["uncultivated area"].concat(this.formatDecimal(uncultivated_area, 2));
        }
        if (this.mode == "gauge")  {
          // format values to 2 decimals
          columns[0] = ["fraction under crops"].concat(this.formatDecimal(this.crop_status.crop_status.fraction_under_crops *100, 2));
        }

        document.getElementById("chartSpinner_" + this.chartid).classList.add("is-hidden");
        document.getElementById("chart_" + this.chartid).classList.remove("is-hidden");
        document.getElementById("chartNotice_"+this.chartid).classList.add("is-hidden");

        this.createChart(columns);
      }
    },
    createChart: function(data) {

      let color_options = {};

      if (this.mode == "gauge") {
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

      if (this.mode == "pie" || this.mode == "donut") {
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
        bindto: '#chart_'+this.chartid,
        //fixHeightResizing: true,
        size: {
          width: this.chartWidth,  
          height: this.chartHeight
        },
        data: {
          columns: [],
          type: this.mode, 
          colors: pie_color_options,
        },
        pie: pie_options,
        color: color_options,
        transition: {
            duration: 750
        },
      });

      // toggles animation of chart
      this.chart.load({columns: data});

    },
    /* GUI helper */
    toggleChartOptions: function() {
      let isGraphOptionsActive = false;
      isGraphOptionsActive = !(document.getElementById("chartOptions_"+this.chartid).classList.contains("is-hidden"));
  
      if (isGraphOptionsActive) {
          document.getElementById("chartOptions_"+this.chartid).classList.add("is-hidden");
          document.getElementById(this.chartid).getElementsByClassName("chartOptionsTitle")[0].children[0].classList.remove("is-active");
      }
      else {
          document.getElementById("chartOptions_"+this.chartid).classList.remove("is-hidden");
          document.getElementById(this.chartid).getElementsByClassName("chartOptionsTitle")[0].children[0].classList.add("is-active");
      }
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
      script.src = url;  // set its src to the provided URL
      document.body.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
      script.onload = function () {
        callback();
      };
    }
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.triggerResize)
  }
});