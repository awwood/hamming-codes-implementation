/// Encoding and decoding logic ///

// Given decimal integer return (0-padded) 16-bit string representation
function decimalToBitString (d) {
  let B = ''
  while (d > 0) {
    const bit = d % 2
    B = bit + B
    d = Math.floor(d / 2)
  }
  while (B.length < 16) {
    B = '0' + B
  }
  return B
}

// Given bit string return decimal representation
function bitStringToDecimal (b) {
  let result = 0
  for (let j = 0; j < b.length; j++) {
    result += b[j] * 2 ** (b.length - j - 1)
  }
  return result
}

// Given a message (16-bit integer with 5 leading 0s)
// return the codeword (16-bit integer)
function encode (n) {
  // Easier to work with an array than a string
  const message = [...decimalToBitString(n)]
  const bitsArray = Array(16).fill('0')

  // Set the 11 message bits in their correct locations
  let count = 1 // start at 1 because we skip the first bit
  for (let i = 1; i < 16; i++) {
      // if i is a power of 2 this will be a parity bit so skip
    if (Number.isInteger(Math.log2(i))) {
      count++
    } else { // otherwise put the next message bit at position i in the array
      bitsArray[i] = message[i - count + 5]
    }
  }

  // Set the 4 parity bits
  for (let i = 0; i < 16; i++) {
    // get index as a 4-bit string
    let indexBits = decimalToBitString(i).slice(12, 16)

    // Each iteration of this loop sets the parity bit
    // at index 2^j to its proper value
    for (let j = 0; j <= 3; j++) { // 3 = lg(16) - 1
        if (indexBits[3 - j] == '1' && bitsArray[i] == '1') {
        bitsArray[2 ** j] = (bitsArray[2 ** j] + 1) % 2
      }
    }
  }

  // Set the zeroth bit checking parity of whole block for the extended code
  for (let i = 0; i < 16; i++) {
    if (bitsArray[i] == '1') {
      bitsArray[0] = (bitsArray[0] + 1) % 2
    }
  }

  // Convert array back into bit string
  // This bit string is the Hamming codeword
  const codeword = bitsArray.join('')

  // Return number corresponding to the codeword
  return bitStringToDecimal(codeword)
}

// Given a codeword (16-bit integer) return the original message
// (16-bit integer with 5 leading 0s)
// Perform single-error correction
// Return an indicator value if multiple errors detected
// which the calling function should handle appropriately
function decode (n) {
  // Get the 16-bit string representing input
  let w = decimalToBitString(n)
  let errorIndex = 0
  let numOnes = 0
  // After this loop concludes, if errorIndex is nonzero then it
  // is the index of any single error in the bit string. For multiple
  // errors it might still be zero.
  // 
  // numOnes is used for checking the parity of the entire codeword
  // In a correct codeword it should be even
  for (let i = 0; i < 16; i++) {
    if (w[i] == '1') {
      errorIndex = i ^ errorIndex
      numOnes++
    }
  }

  // If there is only one error, then the overall parity (checked by the 0 bit) should be wrong
  // and errorIndex points to the bit which is wrong
  if (errorIndex != 0 && numOnes % 2 != 0) {
    // Correct the error by flipping the codeword bit at the error index
    if (w[errorIndex] == '0') {
      w = w.slice(0, errorIndex) + '1' + w.slice(errorIndex + 1, w.length)
    } else {
      w = w.slice(0, errorIndex) + '0' + w.slice(errorIndex + 1, w.length)
    }
  }

  if (errorIndex != 0 && numOnes % 2 == 0) {
    // console.log('Multiple errors found')
    // Normal return range is [0, 1, ... 2047] so this always means an error
    return 65535 // Maximum 16-bit integer
  }

  // Get the message back if there are no errors
  let m = '' // holds the decoded message

  // Iterate over the codeword bits and get only
  // the message bits (ones which aren't 0 or powers of 2)
  for (let i = 1; i < 16; i++) {
    if (!Number.isInteger(Math.log2(i))) {
      m += w[i]
    }
  }
  // Return number corresponding to the decoded message string
  return bitStringToDecimal(m)
}

// Given an array of integers overwrite them
// using the encoding procedure
// Assumes any integers have at most 11 significant bits (ie are < 2048)
function store (arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = encode(arr[i])
  }
}

// Search an encoded array for first instance of key
// return -2 if unrecoverable error
// return index if found
// return -1 if not found
function search (arr, key) {
  for (let i = 0; i < arr.length; i++) {
    message = decode(arr[i])
    if (message == 65535) {
      return -2
    }
    if (message == key) {
      return i
    }
  }
  return -1
}

/// Tests ///

// Flip a single bit at random in a bit string
function flipSingleBit (w) {
  const i = Math.floor(Math.random() * w.length)
  let res = w.slice()
  if (w[i] == '0') {
    // set res[i] to '1'
    res = res.slice(0, i) + '1' + res.slice(i + 1, w.length)
  } else {
    // set res[i] to '0'
    res = res.slice(0, i) + '0' + res.slice(i + 1, w.length)
  }
  console.log('Introduced error at index ' + i)
  return res
}

// Flip two different bits at random in a bit string
function flipTwoBits (w) {
  const i = Math.floor(Math.random() * w.length)
  let j = i
  while (j == i) {
    j = Math.floor(Math.random() * w.length)
  }
  let res = w.slice()
  if (w[i] == '0') {
    // set res[i] to '1'
    res = res.slice(0, i) + '1' + res.slice(i + 1, w.length)
  } else {
    // set res[i] to '0'
    res = res.slice(0, i) + '0' + res.slice(i + 1, w.length)
  }
  if (w[j] == '0') {
    // set res[j] to '1'
    res = res.slice(0, j) + '1' + res.slice(j + 1, w.length)
  } else {
    // set res[j] to '0'
    res = res.slice(0, j) + '0' + res.slice(j + 1, w.length)
  }
  console.log('Introduced errors at indices ' + i + ', ' + j)
  return res
}


// Encode a small array without errors and search for some keys
function test1 () {
  console.log('\nRunning test 1\n')
  const A = [
    31,
    140,
    56
  ]
  
  store(A)
  console.log(A) // Expected: [ 24735, 43276, 18616 ]
  console.log(search(A, 31)) // Expected: 0
  console.log(search(A, 100)) // Expected: -1
}

// Encode a small array with at most one error per entry
// and search for some keys
function test2 () {
  console.log('\nRunning test 2\n')
  const A = [
    1010,
    0,
    620
  ]

  store(A)
  console.log(A) // Expected: [ 10098, 0, 27756 ]

  // Introduce errors in the stored data
  for (let i = 0; i < A.length; i++) {
    let b = decimalToBitString(A[i])
    b = flipSingleBit(b)
    A[i] = bitStringToDecimal(b)
  }

  console.log(A) // Seemingly random integers

  // Because only one error was introduced per entry 
  // search will still perform correctly
  console.log(search(A, 620)) // Expected: 2
  console.log(search(A, 1)) // Expected: -1
}

// Encode a small with multiple errors per entry
// and search for some keys
function test3 () {
  console.log('\nRunning test 3\n')
  const A = [
    2111,
    390,
    312
  ]

  store(A)
  console.log(A) // Expected: [ 49215, 41734, 58040 ]

  // Introduce errors in the stored data
  for (let i = 0; i < A.length; i++) {
    let b = decimalToBitString(A[i])
    b = flipTwoBits(b)
    A[i] = bitStringToDecimal(b)
  }

  console.log(A) // Seemingly random integers

  // Because multiple errors were introduced per entry, search
  // will fail to correct them so cannot retrieve the stored data.
  // The error value -2 will be returned
  console.log(search(A, 390)) // Expected: -2
}

test1()
test2()
test3()
