/**
 Cisco SocialMiner - Simple HTTP Proxy to enable testing of the SocialMiner task HTML
 form.

 Version 10.0(1)
 Cisco Systems, Inc.
 http://www.cisco.com/

 Portions created or assigned to Cisco Systems, Inc. are
 Copyright (c) 2013 Cisco Systems, Inc. or its affiliated entities.  All Rights Reserved.

 This javascript library is made available to Cisco partners and customers as
 a convenience to help minimize the cost of Cisco SocialMiner customizations.
 This library can be used in Cisco SocialMiner deployments.  Cisco does not
 permit the use of this library in customer deployments that do not include
 Cisco SocialMiner.  Support for the javascript library is provided on a
 "best effort" basis via CDN.  Like any custom deployment, it is the
 responsibility of the partner and/or customer to ensure that the
 customization works correctly and this includes ensuring that the Cisco
 SocialMiner JavaScript is properly integrated into 3rd party applications.
 Cisco reserves the right to make changes to the javascript code and
 corresponding API as part of the normal Cisco SocialMiner release cycle.  The
 implication of this is that new versions of the javascript might be
 incompatible with applications built on older SocialMiner integrations.  That
 said, it is Cisco's intention to ensure javascript compatibility across
 versions as much as possible and Cisco will make every effort to clearly
 document any differences in the javascript across versions in the event
 that a backwards compatibility impacting change is made.
**/

var SOCIAL_MINER_PORT           = 80;

var STATIC_CONTENT_LISTEN_PORT  = 8082;
var API_PROXY_LISTEN_PORT  = 8080;

var http = require('http'), url=require('url'), querystring = require('querystring'), httpProxy = require('http-proxy'), static = require('node-static'),
  argv = require('optimist')
    .usage('usage: $0 --host socialMiner')
    .demand(['host'])
    .argv;

require('dotenv').config();

const IC_API_URL = process.env.IC_API_URL;
const IC_AUDIENCE = process.env.IC_AUDIENCE;
const IC_ACCESS_TOKEN = process.env.IC_ACCESS_TOKEN;
const IC_URL_DURATION = process.env.IC_URL_DURATION;
const IC_BASE_SUBJECT = process.env.IC_BASE_SUBJECT;
const IC_AGENT_BASEURL = process.env.IC_AGENT_BASEURL;
const IC_CLIENT_BASEURL = process.env.IC_CLIENT_BASEURL;
const TSK_RT_BASE_HOST = process.env.TSK_RT_BASE_HOST;

var socialMinerHost = argv.host;

global.instantURLsMap = {};

console.log('Proxying API requests for ' + socialMinerHost);

var fileServer = new static.Server('../html');

// Create a simple server to serve up the task.html page.
//
var staticContentServer = http.createServer(function (request, response)
{
    request.addListener('end', function ()
    {
        fileServer.serve(request, response);
    }).resume();

}).listen(STATIC_CONTENT_LISTEN_PORT);

staticContentServer.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('ERROR:  The port: '+ STATIC_CONTENT_LISTEN_PORT +' is currently occupied. Please change STATIC_CONTENT_LISTEN_PORT to free port');
    process.exit();
    
  }
});

staticContentServer.on('listening', function () {
	console.log('Static content server listening on ' + STATIC_CONTENT_LISTEN_PORT);
});

// Create a proxy to proxy requests for the task.html page as well as API
// requests to SocialMiner.
//
var proxy = new httpProxy.RoutingProxy();

var proxyServer =  http.createServer(function(request, response)
{
  console.log('Request url: ' + request.url);
  const queryObject = url.parse(request.url,true).query;

  targetHost = '127.0.0.1';
  targetPort = STATIC_CONTENT_LISTEN_PORT;

/*    // Enabling CORS to allow all domains
    const headerOptions = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Content-Type': 'application/json'
    };*/

  if (url.parse(request.url).path == '/teleconsultCreate') { //check the URL of the current request
/*
            var agentURL='https://instant.webex.com/hc/v1/login?&fli=true&int=jose&data=eyJwMnMiOiIxRDBQLXc5dnloSHF6SVZsRnZPdVpnMFdCVDRuU1BvLTNZWjN2WGxNUUtLZ2hoNVNuX0RPZGEtbmJXY1ZMNEVyX3NZZjk5REpqRVpoOWQxMWNzb0cyRVd1aHUzaiIsInAyYyI6MjY0MTcsImF1ZCI6ImE0ZDg4NmIwLTk3OWYtNGUyYy1hOTU4LTNlOGMxNDYwNWU1MSIsImlzcyI6IjliNWNiYmY2LWY5YmMtNDJlZi1hMjBjLTE0MDI4YjI1MzcyYiIsImN0eSI6IkpXVCIsImVuYyI6IkEyNTZHQ00iLCJhbGciOiJQQkVTMi1IUzUxMitBMjU2S1cifQ.IyL7SHXB9vr-VyzlBqm7enerecie2LQ9_6mMQ33S8WpVKeP7TgXfLQ.wIjo76qqGMiJL9oW.aT8mTgIdO4c-6uENjBp9aKXM9lqNtpTvI-volrrIUbcxNd8M61IELBXkked1xvFVzBb4uOEWAxa-m1EHPVT7mc_Nu0VmScN0MYmlUG2KhFWllEljFCuc2UpFu6mdjn_vQUTZrz29cZa4rDijV8pa3yiarBPz6mR08_64h-hQ7aCeNwSlVHdlQLucTnwLvc67TcVxrq_WZN2g0oKVqkB6MJWOzEFuqFdvftUaL3wAKm7g_rllWR9w20gcWnD6Z5_JJItWFlrCupzN5_Wj1rl2RNEL_cGAnZc9BkRMDd2qFcRaVvQt4VE2_1BkJnvuEMyogtUneQbUOQvvODW3T1BIwEu5FUJpMvb-G4rHw5QNWixOQ2caHKGrwNqXrHVVYyc-G-Svnf4LEHjY7cmc4SDrsosFBJZb61KDMBrpdi5gvHFZLfNJl3JPcl3bKuzLB2bO5yuyn6oW4BpauiAZGq0Dvo8S0DhuL-czLAaOR8zR6oJDchqNq0FomlDAKZY8lWaDiodF3ZwROODs0g.x7sJNadkZfnrAfe_vVrbdQ';
            var clientURL='https://instant.webex.com/hc/v1/talk?int=jose&data=eyJwMnMiOiJScGVKOWNLYXVyNGRvSTliZjBmazlueVFScFdTYzVwd1pwY1Y5dVRjZkNFM1BSdWsiLCJwMmMiOjIxNTU5LCJhdWQiOiJhNGQ4ODZiMC05NzlmLTRlMmMtYTk1OC0zZThjMTQ2MDVlNTEiLCJpc3MiOiI5YjVjYmJmNi1mOWJjLTQyZWYtYTIwYy0xNDAyOGIyNTM3MmIiLCJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUEJFUzItSFM1MTIrQTI1NktXIn0.ZOVYZsiGndxxYCXopqxgGO3h_CPpuVr8mJS2EIqh7codFJO1gMDoaA.j81J4sEo41sph065.hRvdZfm_xwl-wV4VAumaZkpMteNnjw6H2I1SxwuZP6iiaPPZJWK4_WxGx489tGY-hcBTbmN10D6jI4i_yQT2f57hhbZH0vb9U66YQHryNpmhfUzDzu11q5kyABpnG0pW56WyZItS9Y6K7HA_tVn_nmGngdu932GVC8553Z1Ezl_3omjHoIEppnGhIOYoXE7kTTIzaNJdbkvXnzUmjSr7XG5eelmnB_7WR-gnlLvAJ8Gg4wWbafeTcEpGit6Y0d-kqP4EBO2SpfAnR8w09Sv9QyrKyuICXK7PgoEPbEZMyxIu6IO1-c0SWjFAK8xTM1INkYfmoo8lVGPvj-SqsuLAXmDlUi5eQacve9eeqoIuyfGJt2yh3vGZ3B5_T4NunqkJ-mZQO_IFz5p5_ZjQ2XIT1YR4lY0LJC0EOFqC_GAi87vPdpC-EG49RLBqu7PirKgFajGSKxozXz5PMfvd1B9ZrwPRY-bHP_5e4F3f5r42Qj0LyVLJF0i8YRYM9crqzyKdoDLNwvOti_IlnPg.A0pXLct_hcSCQ3W3tZKEJw';


            var agentURL='https://instant.webex.com/hc/v1/login?&fli=true&int=jose&data=';
            var clientURL='https://instant.webex.com/hc/v1/talk?int=jose&data=';
            */

            // Create private token to associate with generated Instant Connect URLs
            // Including crypto module
            const crypto = require('crypto');
            var privateToken;
            // it is unlikely that we will generate a random privateToken key that is already in the
            // instantURLsMap dict, but still need to check just in case.
            do {
                   // Calling randomBytes method without callback
                   privateToken = crypto.randomBytes(10).toString('hex');
                } while (privateToken in instantURLsMap);

            // Calling randomBytes method without callback
            privateToken = crypto.randomBytes(10).toString('hex');
            // Prints random bytes of generated data
            console.log("The random bytes of data generated is: "
                            + privateToken);

            let nowSecs=Math.floor(Date.now() / 1000)


            // Generate a new pair of Instant Connect Links that expire xx seconds in the future  (default 3 hours)
            var request = require('request');
            var options = {
              'method': 'POST',
              'url': IC_API_URL,
              'headers': {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+IC_ACCESS_TOKEN
              },
              body: JSON.stringify({
                "aud": IC_AUDIENCE,
                "jwt": {
                  "sub": IC_BASE_SUBJECT+privateToken,
                  "exp": nowSecs+parseInt(IC_URL_DURATION)
                }
              })

            };
            request(options, function (theerror, theresponse) {
                if (theerror)
                    {
                    throw new Error(theerror);
                    }
                else {
                        console.log("Call to IC returned: ",theresponse.body);
                        let responseJSON=JSON.parse(theresponse.body);
                        agentURL=IC_AGENT_BASEURL+responseJSON['host'][0];
                        clientURL=IC_CLIENT_BASEURL+responseJSON['guest'][0];
                        // keep track of URLS generated and timestamp in a dict indexed by the private token
                        instantURLsMap[privateToken]=[agentURL,clientURL,nowSecs];
                        //console.log('After instantURLsMap additions...')
                        //console.log(instantURLsMap);

                        response.writeHead(200);
                        response.write(JSON.stringify([privateToken,agentURL,clientURL,TSK_RT_BASE_HOST]));
                        response.end();
                }
                return;
            });

/*
            // keep track of URLS generated and timestamp in a dict indexed by the private token
            instantURLsMap[privateToken]=[agentURL,clientURL,nowSecs];
            //console.log('After instantURLsMap additions...')
            //console.log(instantURLsMap);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.write(JSON.stringify([privateToken,agentURL,clientURL]));
            response.end();
            return;
*/

  }

  else if (url.parse(request.url).pathname == '/getAgentURL') { // return Agent URL that corresponds to private token.
            let tokenFound=false;

            // First clean up any entries on the map that might be older than IC_URL_DURATION seconds
            for (const [key, value] of Object.entries(instantURLsMap)) {
              let nowSecs=Math.floor(Date.now() / 1000)
              if ( nowSecs > (value[2]+parseInt(IC_URL_DURATION)) ) {
                delete instantURLsMap[key];
                //console.log("Deleted key: ",key)
              }
            }
            //console.log('After instantURLsMap cleanup...')
            //console.log(instantURLsMap);
            const getAgentQS=querystring.parse(url.parse(request.url).query);
            if ("token" in getAgentQS) {
                theToken=getAgentQS.token;
                console.log("Token is: ",theToken)
                if (theToken in instantURLsMap) {
                      //let agentURL='https://instant.webex.com/hc/v1/login?&fli=true&int=jose&data=eyJwMnMiOiIxRDBQLXc5dnloSHF6SVZsRnZPdVpnMFdCVDRuU1BvLTNZWjN2WGxNUUtLZ2hoNVNuX0RPZGEtbmJXY1ZMNEVyX3NZZjk5REpqRVpoOWQxMWNzb0cyRVd1aHUzaiIsInAyYyI6MjY0MTcsImF1ZCI6ImE0ZDg4NmIwLTk3OWYtNGUyYy1hOTU4LTNlOGMxNDYwNWU1MSIsImlzcyI6IjliNWNiYmY2LWY5YmMtNDJlZi1hMjBjLTE0MDI4YjI1MzcyYiIsImN0eSI6IkpXVCIsImVuYyI6IkEyNTZHQ00iLCJhbGciOiJQQkVTMi1IUzUxMitBMjU2S1cifQ.IyL7SHXB9vr-VyzlBqm7enerecie2LQ9_6mMQ33S8WpVKeP7TgXfLQ.wIjo76qqGMiJL9oW.aT8mTgIdO4c-6uENjBp9aKXM9lqNtpTvI-volrrIUbcxNd8M61IELBXkked1xvFVzBb4uOEWAxa-m1EHPVT7mc_Nu0VmScN0MYmlUG2KhFWllEljFCuc2UpFu6mdjn_vQUTZrz29cZa4rDijV8pa3yiarBPz6mR08_64h-hQ7aCeNwSlVHdlQLucTnwLvc67TcVxrq_WZN2g0oKVqkB6MJWOzEFuqFdvftUaL3wAKm7g_rllWR9w20gcWnD6Z5_JJItWFlrCupzN5_Wj1rl2RNEL_cGAnZc9BkRMDd2qFcRaVvQt4VE2_1BkJnvuEMyogtUneQbUOQvvODW3T1BIwEu5FUJpMvb-G4rHw5QNWixOQ2caHKGrwNqXrHVVYyc-G-Svnf4LEHjY7cmc4SDrsosFBJZb61KDMBrpdi5gvHFZLfNJl3JPcl3bKuzLB2bO5yuyn6oW4BpauiAZGq0Dvo8S0DhuL-czLAaOR8zR6oJDchqNq0FomlDAKZY8lWaDiodF3ZwROODs0g.x7sJNadkZfnrAfe_vVrbdQ';
                      tokenFound=true;
                      let agentURL=instantURLsMap[theToken][0];
                      response.writeHead(200);
                      response.write(JSON.stringify( [agentURL] ));
                      response.end();
                }
            }
            if (!tokenFound) {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify( "Invalid or missing token" ));
                response.end();
            }
            return;
  }

  else {
          if ( request.url && (request.url.indexOf('/ccp/') === 0) )
          {
            // Any requests that start with /ccp/ are deemed API requests and are directed to SocialMiner.
            //
            targetHost = socialMinerHost;
            targetPort = SOCIAL_MINER_PORT;
          }

          console.log('Target host: ' + targetHost);
          console.log('Target port: ' + targetPort);
          proxy.proxyRequest(request, response,
          {
            host: targetHost,
            port: targetPort
          });
  }
}).listen(API_PROXY_LISTEN_PORT);

proxyServer.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('ERROR:  The port: '+ API_PROXY_LISTEN_PORT +' is currently occupied. Please change API_PROXY_LISTEN_PORT to free port');
    process.exit();
    
  }
});

proxyServer.on('listening', function () {
	console.log('SocialMiner API proxy listening on ' + API_PROXY_LISTEN_PORT);
});