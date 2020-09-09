it(`Generate ${process.env.BATCH_COUNT} batches`, async function() {
  const activateBatches = async (value) => {
    const bodyRequest = makeBodyRequest(value)
    const resGenerateBatch = await appMicroservice.batchControllerV2.postGenerateBatch(bodyRequest)

    await reportStep('Verify that to the correct request to "/wf-api/Batch/v1/generateBatch" - comes 200 response status', async () => {
      expect(resGenerateBatch.status).equal(200, `${JSON.stringify(resGenerateBatch.body)}`)
    })
    await reportStep('Verify that to the correct request - comes specified properties', async () => {
      expect(resGenerateBatch.body).to.be.jsonSchema(batchSchemas.generateBatch)
    })

    let resBatch
    let count = 0

    do {
      resBatch = await appMicroservice.batchController.getBatch(resGenerateBatch.body.tag)
      await (async () => new Promise((res) => setTimeout(res, 1000)))()
      count += 1
    } while(!resBatch.body.ID && count < 15)

    await reportStep(`Verify that to the correct request to "/wf-api/Batch/get/${resGenerateBatch.body.tag}" - comes 200 response status`,
      async () => {
        expect(resBatch.status).equal(200, `${JSON.stringify(resBatch.body)}`)
      }, false)

    const resDownloadFile = await appMicroservice.batchControllerV2
      .postDownloadFile(resGenerateBatch.body.tag, bodyRequest)

    await reportStep('Verify that to the correct request - comes 200 response status', async () => {
      expect(resDownloadFile.status).equal(200, `${JSON.stringify(resDownloadFile.body)}`)
    }, false)
    await reportStep('Verify that to the correct request - comes specified properties', async () => {
      expect(resDownloadFile.body).to.be.jsonSchema(batchSchemas.common)
    }, false)

    const resDeleteFile = await appMicroservice.batchControllerV2
      .postDeleteFile(resGenerateBatch.body.tag, bodyRequest)

    await reportStep('Verify that to the correct request - comes 200 response status', async () => {
      expect(resDeleteFile.status).equal(200, `${JSON.stringify(resDeleteFile.body)}`)
    }, false)
    await reportStep('Verify that to the correct request - comes specified properties', async () => {
      expect(resDeleteFile.body).to.be.jsonSchema(batchSchemas.common)
    }, false)

    const resActivateBatch = await appMicroservice.batchControllerV2
      .postActivateBatch(resGenerateBatch.body.tag, bodyRequest)

    await reportStep('Verify that to the correct request - comes 200 response status', async () => {
      expect(resActivateBatch.status).equal(200, `${JSON.stringify(resActivateBatch.body)}`)
    }, false)
    await reportStep('Verify that to the correct request - comes specified properties', async () => {
      expect(resActivateBatch.body).to.be.jsonSchema(batchSchemas.common)
    }, false)
  }

  const documentQuantity = new Array(amount).fill(i);

  do {
    const itemsSpliced = documentQuantity.splice(0, 10)
    const callers = itemsSpliced.map((_item, intex) => activateBatches(documentQuantity.length + intex))
    await Promise.all(callers)
  } while(documentQuantity.length);
})


