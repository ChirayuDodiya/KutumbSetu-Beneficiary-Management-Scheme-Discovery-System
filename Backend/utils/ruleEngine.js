/**
 * Evaluates a family and its members against scheme criteria
 * @param {Object} family 
 * @param {Array} members 
 * @param {Object} scheme 
 * @returns {Object} { potentiallyApplicable, passedChecks, failedChecks }
 */
const evaluate = (family, members, scheme) => {
  const criteria = scheme.criteria || {};
  let potentiallyApplicable = true;
  let passedChecks = [];
  let failedChecks = [];

  // 1. Family Income Check
  if (criteria.max_income !== undefined) {
    if (parseFloat(family.annual_income) <= criteria.max_income) {
      passedChecks.push(`Family annual income (₹${family.annual_income}) is within the limit (₹${criteria.max_income})`);
    } else {
      potentiallyApplicable = false;
      failedChecks.push(`Family annual income (₹${family.annual_income}) exceeds the limit (₹${criteria.max_income})`);
    }
  }

  // 2. Family Caste Check
  if (criteria.caste_allowed && Array.isArray(criteria.caste_allowed)) {
    if (criteria.caste_allowed.includes(family.caste)) {
      passedChecks.push(`Family caste (${family.caste}) is eligible`);
    } else {
      potentiallyApplicable = false;
      failedChecks.push(`Family caste (${family.caste}) is not eligible for this scheme`);
    }
  }

  // 3. Member-specific Rules
  // If member_rules exist, AT LEAST ONE member must satisfy all conditions of AT LEAST ONE rule block.
  if (criteria.member_rules && criteria.member_rules.length > 0) {
    let anyMemberPassed = false;
    let memberSuccessReasons = [];

    for (const member of members) {
      for (const rule of criteria.member_rules) {
        let memberPassesRule = true;
        let reasons = [];

        if (rule.min_age !== undefined && member.age < rule.min_age) {
          memberPassesRule = false;
        } else if (rule.min_age !== undefined) {
          reasons.push(`age >= ${rule.min_age}`);
        }

        if (rule.max_age !== undefined && member.age > rule.max_age) {
          memberPassesRule = false;
        } else if (rule.max_age !== undefined) {
          reasons.push(`age <= ${rule.max_age}`);
        }

        if (rule.is_student !== undefined && Boolean(member.is_student) !== rule.is_student) {
          memberPassesRule = false;
        } else if (rule.is_student !== undefined) {
          reasons.push(rule.is_student ? `is a student` : `is not a student`);
        }

        if (rule.is_parent_alive !== undefined && Boolean(member.is_parent_alive) !== rule.is_parent_alive) {
          memberPassesRule = false;
        } else if (rule.is_parent_alive !== undefined) {
          reasons.push(rule.is_parent_alive ? `parents alive` : `parents deceased`);
        }

        if (memberPassesRule) {
          anyMemberPassed = true;
          memberSuccessReasons.push(`${member.name} qualifies (${reasons.join(', ')})`);
          break; // Member matched this rule, no need to check other rule blocks for this member
        }
      }
    }

    if (anyMemberPassed) {
      passedChecks.push(`Found eligible family members: ${memberSuccessReasons.join('; ')}`);
    } else {
      potentiallyApplicable = false;
      failedChecks.push(`No family members meet the specific age/student/social criteria for this scheme`);
    }
  }

  return {
    potentiallyApplicable,
    passedChecks,
    failedChecks
  };
};

module.exports = { evaluate };
