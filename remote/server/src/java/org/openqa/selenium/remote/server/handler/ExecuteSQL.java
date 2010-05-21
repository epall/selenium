/*
Copyright 2007-2010 WebDriver committers
Copyright 2007-2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package org.openqa.selenium.remote.server.handler;

import java.util.List;
import java.util.Map;

import org.openqa.selenium.html5.DatabaseStorage;
import org.openqa.selenium.remote.Response;
import org.openqa.selenium.remote.server.DriverSessions;
import org.openqa.selenium.remote.server.JsonParametersAware;
import org.openqa.selenium.remote.server.handler.internal.ArgumentConverter;
import org.openqa.selenium.remote.server.handler.internal.ResultConverter;
import org.openqa.selenium.remote.server.rest.ResultType;

import com.google.common.collect.Iterables;
import com.google.common.collect.Lists;

public class ExecuteSQL extends WebDriverHandler implements JsonParametersAware {
  private Response response;
  private String dbName;
  private String query;
  private List<Object> args = Lists.newArrayList();

  public ExecuteSQL(DriverSessions sessions) {
    super(sessions);
  }
  
  public ResultType call() throws Exception {
	response = newResponse();
	Object value =
	    ((DatabaseStorage) unwrap(getDriver())).executeSQL(dbName, query, args.toArray());
	Object result = new ResultConverter(getKnownElements()).apply(value);
	response.setValue(result);
	return ResultType.SUCCESS;
  }
  
  public void setJsonParameters(Map<String, Object> allParameters) throws Exception {
    dbName = (String) allParameters.get("dbName");
    query = (String) allParameters.get("query");
    List<?> params = (List<?>) allParameters.get("args");
    args = Lists.newArrayList(Iterables.transform(params,
        new ArgumentConverter(getKnownElements())));
  }
  
  public Response getResponse() {
    return response;
  }
  
  public String toString() {
    return String.format("[execute SQL query: %s, %s, %s]", dbName, query, args);
  }
}
