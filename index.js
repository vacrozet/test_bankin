const axios = require("axios");
const { flattenDeep } = require("lodash");

const host = "http://localhost:3000";

const login = async ({ user, password }) => {
  const { data } = await axios
    .post(
      `${host}/login`,
      { user, password },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic QmFua2luQ2xpZW50SWQ6c2VjcmV0",
        },
      }
    )
    .catch((err) => {
      console.log(err);
    });
  return data.refresh_token;
};

const token = async ({ refresh_token }) => {
  const { data } = await axios
    .post(
      `${host}/token`,
      { grant_type: "refresh_token", refresh_token },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refresh_token}`,
        },
      }
    )
    .catch((err) => {
      console.log(err.response.data);
    });
  return data.access_token;
};

const getAccount = async ({ access_token, page }) => {
  const { data } = await axios
    .get(`${host}/accounts?page=${page}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    })
    .catch((err) => {
      console.log(err.response.data);
    });
  return data;
};

const getAllAccount = async ({ access_token }) => {
  const tab = [];
  for (let index = 0; ; index++) {
    const { account, link } = await getAccount({
      access_token,
      page: index + 1,
    });
    tab.push(account);
    if (link.next === null) break;
  }
  return flattenDeep(tab);
};

const getTransaction = async ({ access_token, acc_number, page }) => {
  const { data } = await axios
    .get(`${host}/accounts/${acc_number}/transactions?page=${page}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    })
    .catch((err) => {
      return {
        transactions: [],
        link: {
          next: null,
        },
      };
    });
  if (data === null || data === undefined) {
    return {
      transactions: [],
      link: {
        next: null,
      },
    };
  }
  return data;
};

const getallTransaction = async ({ acc_number, access_token }) => {
  const tabTransaction = [];
  for (let index = 1; ; index++) {
    const { transactions, link } = await getTransaction({
      access_token,
      acc_number,
      page: index,
    });
    if (transactions === undefined || transactions === null) {
      break;
    }
    tabTransaction.push(transactions);
    if (link && link.next === null) {
      break;
    }
  }
  return flattenDeep(tabTransaction);
};

const getallFinal = async ({ access_token, allAcount }) => {
  const alltransaction = await Promise.all(
    allAcount.map(async ({ acc_number, amount }) => {
      const allTransaction = await getallTransaction({
        acc_number,
        access_token,
      });
      return {
        acc_number,
        amount,
        transactions: allTransaction,
      };
    })
  );
  return alltransaction;
};

const init = async () => {
  const user = "BankinUser";
  const password = "12345678";
  const refresh_token = await login({ user, password });
  const access_token = await token({ refresh_token });
  const allAcount = await getAllAccount({ access_token });
  const allTransaction = await getallFinal({ access_token, allAcount });
  console.log(allTransaction);
};

init();
