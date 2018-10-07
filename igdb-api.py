from urllib.request import Request
from urllib.request import urlopen


def application(environ, start_response):
    path = environ['REQUEST_URI'].replace(environ['SCRIPT_NAME'], '')
    query = environ['QUERY_STRING']
    user_key = environ['HTTP_USER_KEY']

    url = 'https://api-2445582011268.apicast.io%s?%s' % (path, query)

    req = Request(url)
    req.add_header('user-key', user_key)
    resp = urlopen(req)
    content = resp.read()

    status = '200 OK'
    response_headers = [('Content-type', 'text/plain'), ('Content-Length', str(len(content)))]
    start_response(status, response_headers)
    return [content]
