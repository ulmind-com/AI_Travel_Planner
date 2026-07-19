const axios = require('axios');
const FormData = require('form-data');

async function test() {
  try {
    const fd = new FormData();
    fd.append('title', 'My Trip: Yokosuka');
    fd.append('content', 'Check this out!');
    fd.append('category', 'Trip Sharing');
    fd.append('tripId', '664123456789012345678901');

    // we don't have a token, so we can't fully test, but we can see if it fails auth
    const res = await axios.post('http://localhost:5000/api/v1/community/posts', fd, {
      headers: fd.getHeaders()
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
test();
