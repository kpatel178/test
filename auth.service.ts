import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "../environments/environment";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ssoUserId: string = "nikunj.dobariya@optus.com.au";
  isLoading = true;

  // GET COOKIE
  getCookie(cookieName: any) {
    let name = cookieName + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(";");
    for (let i = 0; i < cookieArray.length; i++) {
      let c = cookieArray[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  // GET USER ID
  retrieveUserId() {
    return this.http.get(environment.API_ENDPOINT_SSO, {
      headers: new HttpHeaders({
        "Access-Control-Allow-Origin": "*"
      })
    });
  }
  //GET USER DETAILS
  retrieveUserDetails() {
    return this.http.get(environment.API_ENDPOINT_USER_DTL,
     {
      headers:new HttpHeaders({
        "Access-Control-Allow-Origin": "*",
      }),
      observe: 'response'
    });
  }
  //GET CUSTOMER PICKER DROP-DOWN
  getCustomerPickerData(data: string) {
    return this.http.post(
      environment.API_ENDPOINT_CUSTOMER_PICKER,
      { customer_name: data, role_type: "customer_picker_user",
      target_system:environment.CUSTOMER_PICKER_TYPE  },
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          service_now_instance: "nucleus",
          sessionId : this.getCookie("SessionId")
        })
      }
    );
  }

// RETREIVE USER ID 
  getUserId(state:any) {
    this.retrieveUserId().subscribe(
      res => {
        let resp = JSON.parse(JSON.stringify(res));
        if (resp.hasOwnProperty("attributes") && resp.attributes.length > 0) {
          let attributeObj: any[] = resp.attributes;
          attributeObj.find(attr => {
            if (attr.name == "mail") {
              // this.ssoUserId = attr.values[0];
              if (this.isAlphaNumeric(attr.values[0])){
              this.ssoUserId = attr.values[0];
              document.cookie = "user_id" + "=" + this.ssoUserId + "; path=/";
              } else { 
              this.ssoUserId = '';
              console.log('Invalid UserID - ', attr.values[0] );
              }
            }
          });
          let userType = this.getCookie("user_Type");
          if (userType == null || userType == undefined || userType == "") {
            // this.getUserDetails(state);
            this.getUserDetails(state , window.location.href);
          } else {
            this.isLoading = false;
          }
        }
      },
      error => {
        console.log("sveeturisso Error while retrieving UserId", error);
        this.ssoUserId = "";
      }
    );

    // this.ssoUserId = "nikunj.dobariya@optus.com.au";
    // this.ssoUserId =  this.getCookie("user_id");
    // if (this.ssoUserId == null || this.ssoUserId == undefined || this.ssoUserId == "") {
    //   this.ssoUserId = "nikunj.dobariya@optus.com.au";
    // }
    //  document.cookie = "user_id" + "=" +this.ssoUserId +"; path=/";
    //  let userType = this.getCookie('userType'); //hard-coding to bypass SSO on SIT servers
    //  if (userType == null || userType == undefined || userType == "") {
    //  this.getUserDetails(state);
    // } else{
      
    // }
  }

   getUserDetails(state:any, locationURL:any) {
    let userDetails: any;
    let __roleList: any[];
    let __companyUid: any;
    let userName = "";
    let userSysId = "";
    document.cookie = "portal" + "=" + 'Inventory' + "; path=/";
      this.retrieveUserDetails().subscribe(
        result => {
          if (result.body ) {
            userDetails = JSON.parse(JSON.stringify(result.body));
            __roleList = userDetails.roles;
            userSysId = userDetails.data[0].userSysId;
            //__companyUid = result.data[0].companyUID ;
            if (userDetails.data[0].companyUID) {
              if (userDetails.data[0].companyUID == "none") {
                __companyUid = 0;
              } else {
                __companyUid = userDetails.data[0].companyUID;
              }
            } else {
              __companyUid = 0;
            }
            if (userDetails.data[0].firstName && userDetails.data[0].lastName) {
              let firstName = userDetails.data[0].firstName;
              let lastName = userDetails.data[0].lastName;
              userName += firstName + " " + lastName;
            }
            document.cookie = "userSysId" + "=" + userSysId + "; path=/";
            document.cookie = "company_id" + "=" + __companyUid + "; path=/";
            document.cookie = "userName" + "=" + userName + "; path=/";
            if (__roleList && __roleList.length > 0) {
              if (
                __roleList.indexOf("sn_esm_user") > -1 ||
                __roleList.indexOf("sn_customerservice.customer") > -1 ||
                __roleList.indexOf("snc_external") > -1
              ) {
                document.cookie = "user_Type" + "=" + "External" + "; path=/";
                if (__roleList.indexOf("Inventory - Approver") > -1) {
                  document.cookie =
                    "inventory_role" +
                    "=" +
                    "Inventory - Approver" +
                    "; path=/";
                } else if (
                  __roleList.indexOf("Inventory - Requester") > -1
                ) {
                  document.cookie =
                    "inventory_role" +
                    "=" +
                    "Inventory - Requester" +
                    "; path=/";
                } else if (
                  __roleList.indexOf("Inventory - Browser") > -1
                ) {
                  document.cookie =
                    "inventory_role" +
                    "=" +
                    "Inventory - Browser" +
                    "; path=/";
                } else {
                  document.cookie =
                    "inventory_role" +
                    "=" +
                    "" +
                    "; path=/";
                }
              } else if (
                __roleList.indexOf("sn_esm_agent") > -1 ||
                __roleList.indexOf("sn_customerservice.customer_data_viewer") >
                  -1 ||
                __roleList.indexOf("admin") > -1 ||
                __roleList.indexOf("snc_internal") > -1
              ) {
                document.cookie = "user_Type" + "=" + "Internal" + "; path=/";
                if (__roleList.indexOf("Secured_Customer_Access") > -1) {
                  document.cookie = "role_type" + "=" + "secure" + "; path=/";
                } else {
                  document.cookie =
                    "role_type " + "=" + "non-secure" + "; path=/";
                }
                document.cookie =
                  "inventory_role" +
                  "=" +
                  "Inventory - Requester" +
                  "; path=/";
              }
            }
            this.isLoading = false;
            // this.router.navigateByUrl(state);
            // if(state.url.includes( "/requests/serviceHistory")){
            //   window.location.href = locationURL;
            // }else{
            //   this.router.navigateByUrl(state);
            // }
             // window.location.href = locationURL;
             if (locationURL.includes('inventory')) {
              window.location.href = environment.redirectUrl+'/inventory';
            } else if (locationURL.includes('operations')) {
              window.location.href = environment.redirectUrl+'/operations';
            } else if (locationURL.includes('requests')) {
              window.location.href = environment.redirectUrl+'/requests';
            } else {
              window.location.href = environment.redirectUrl+'/inventory';
            } 
          } else {
            this.isLoading = false;
            this.router.navigateByUrl(environment.API_ENDPOINT_MBP);
          }
          if(result.headers){
            // document.cookie = "SessionId" + "=" + result.headers.get('SessionId') + "; path=/";
            if (this.isAlphaNumeric(result.headers.get('SessionId'))){
              document.cookie = "SessionId" + "=" + result.headers.get('SessionId') + "; path=/";
              } else { 
              this.ssoUserId = '';
              console.log('Invalid SessionId - ', result.headers.get('SessionId'));
              }
          }
        },
        error => {
          console.log(
            "sveeturisso Error while retrieving User Details by UserId",
            error
          );
          this.ssoUserId = "";
          this.isLoading = false;
          this.router.navigateByUrl(environment.API_ENDPOINT_MBP);
        }
      );
    // else {
    //   // = false;
    //   console.log(
    //     "sveeturisso this.ssoUserId empty  window.location.href ",
    //     window.location.href
    //   );
    //   this.isLoading = false;
    //   this.router.navigateByUrl(environment.API_ENDPOINT_MBP);
    // }
  }

  loading(){
    return this.isLoading;
  }

  isAlphaNumeric(str) {
    let code, i, len;
    console.log('str',str)
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if ( (code != 45 ) && // hyphen (-)
        !(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
  };
}
