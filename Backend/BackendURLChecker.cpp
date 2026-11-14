#include <iostream>
#include <fstream>
#include <sstream>
#include <cstddef>
#include <string>
#include <cpr/cpr.h>
#include "crow_all.h"

using namespace std;
using namespace crow;
using namespace cpr;
// function prototypes
bool isVaildURL(const string& url);
bool isVaildTopicWithLLM(const string& userinput);
string GEMINI_API_KEY = "AQ.Ab8RN6KGI1yUswn1ozJGZG3VUl1D4kNzOdjicV82hOqr-2ewzg";
int main(){
// Initalize Server
SimpleApp URLChecker;

// root URL
CROW_ROUTE(URLChecker,"/")([](){
return response(200, "Welcome to the URLChecker!");
});

CROW_ROUTE(URLChecker,"/info/URL").methods("POST"_method)([](const request& req){
auto x = json::load(req.body);

if (!x || x.t() != json::type::String) {
    return response(400, "Please enter vaild characters!");
}

string URL;
string Genre;
if (isVaildURL(x.s())){
URL = x.s();
if (!isVaildTopicWithLLM(URL)) {
    return response(400, "Not a real website!");
}
else{
    return response(200, "Perfect! Fetching results...");
}
}
else {
Genre = x.s();
if (!isVaildTopicWithLLM(Genre)) {
    return response(400, "Not a real genre/topic!");
}
else{
    return response(200, "Perfect! Fetching results...");
}
}
});
URLChecker.port(18080).multithreaded().run();
}

bool isVaildURL(const string& url){
    // check if it starts with http:// or https://
    bool http = (url.find("http://") == 0);
    bool https = (url.find("https://") == 0);

    if (!http && !https){
        return false;
    }

    if (url.find(".") == string::npos) {
        return false;
    }

    if (url.find(" ") != string::npos) {
        return false;
    }

    return true;
}

bool isVaildTopicWithLLM(const string& userinput){


json::wvalue payload;
// Build payload
string prompt = 
        "Is '" + userinput + "' a real topic of study/discussion OR a real YouTube URL? "
        "Reject single names (like 'BOB'), random numbers, or gibberish (like 'math448474'). "
        "Reply ONLY with 'VALID' or 'INVALID'";

payload["contents"][0]["parts"][0]["text"] = prompt;

//Generate llm response

Response llm_res = Post(
Url{"https://googleapis.com" + GEMINI_API_KEY},
Header{{"Content-Type", "application/json"}},
Body{payload.dump()}
);

if (llm_res.status_code != 200) {
    return false;
}

auto reply = json::load(llm_res.text);

string answer = reply["candidates"][0]["content"]["parts"][0]["text"].s();

if (answer.find("INVAILD") != string::npos) {
    return false;
}

return true;
}


